import os
import json
import time
from datetime import datetime, timezone
import numpy as np
import pandas as pd
import xgboost as xgb
from sklearn.metrics import (
    roc_auc_score,
    average_precision_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix
)
from preprocess import load_dataset, engineer_features, process_and_encode, TARGET_COL, ID_COL, TIME_COL

def train_and_evaluate():
    data_dir = 'ml-training/data'
    artifacts_dir = 'ml-training/artifacts'
    os.makedirs(artifacts_dir, exist_ok=True)

    print("Step 1: Loading Raw Data...")
    df_raw = load_dataset(data_dir)

    print("Step 2: Feature Engineering...")
    df_fe = engineer_features(df_raw)

    print("Step 3: Preprocessing and Encoding...")
    df_processed, encoding_map, feature_cols = process_and_encode(df_fe, is_training=True)

    # Sort chronologically by TransactionDT to ensure leak-free temporal splitting
    print("Step 4: Sorting Chronologically by TransactionDT...")
    df_processed = df_processed.sort_values(by=TIME_COL).reset_index(drop=True)

    total_rows = len(df_processed)
    train_end = int(total_rows * 0.70)
    val_end = int(total_rows * 0.85)

    print(f"Total dataset size: {total_rows} rows.")
    print(f"Train split: 0 to {train_end} ({train_end} rows, ~70%)")
    print(f"Validation split: {train_end} to {val_end} ({val_end - train_end} rows, ~15%)")
    print(f"Test split: {val_end} to {total_rows} ({total_rows - val_end} rows, ~15%)")

    train_df = df_processed.iloc[:train_end]
    val_df = df_processed.iloc[train_end:val_end]
    test_df = df_processed.iloc[val_end:]

    X_train = train_df[feature_cols]
    y_train = train_df[TARGET_COL]

    X_val = val_df[feature_cols]
    y_val = val_df[TARGET_COL]

    X_test = test_df[feature_cols]
    y_test = test_df[TARGET_COL]

    # Calculate scale_pos_weight dynamically from training data
    num_neg = (y_train == 0).sum()
    num_pos = (y_train == 1).sum()
    scale_pos_weight = float(num_neg / max(num_pos, 1))
    overall_fraud_rate = float(df_processed[TARGET_COL].mean())
    train_fraud_rate = float(y_train.mean())

    print(f"Training set positives (fraud): {num_pos}, negatives (legit): {num_neg}")
    print(f"Calculated scale_pos_weight: {scale_pos_weight:.4f}")

    print("Step 5: Training XGBoost Fraud Classifier (v1)...")
    model = xgb.XGBClassifier(
        n_estimators=500,
        max_depth=6,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        scale_pos_weight=scale_pos_weight,
        objective='binary:logistic',
        eval_metric='auc',
        random_state=42,
        tree_method='hist',
        early_stopping_rounds=50
    )

    model.fit(
        X_train, y_train,
        eval_set=[(X_val, y_val)],
        verbose=50
    )

    print("Step 6: Saving Trained Model Artifact...")
    model_artifact_path = os.path.join(artifacts_dir, 'nexora_fraud_v1.json')
    model.save_model(model_artifact_path)
    print(f"Model saved to {model_artifact_path}")

    print("Step 7: Evaluating strictly on held-out test set...")
    y_pred_prob = model.predict_proba(X_test)[:, 1]
    
    roc_auc = float(roc_auc_score(y_test, y_pred_prob))
    pr_auc = float(average_precision_score(y_test, y_pred_prob))
    
    # Binary predictions using 0.5 classification threshold
    threshold = 0.5
    y_pred_bin = (y_pred_prob >= threshold).astype(int)

    precision = float(precision_score(y_test, y_pred_bin, zero_division=0))
    recall = float(recall_score(y_test, y_pred_bin, zero_division=0))
    f1 = float(f1_score(y_test, y_pred_bin, zero_division=0))
    
    tn, fp, fn, tp = confusion_matrix(y_test, y_pred_bin).ravel()
    fpr = float(fp / (fp + tn)) if (fp + tn) > 0 else 0.0
    fnr = float(fn / (fn + tp)) if (fn + tp) > 0 else 0.0

    metrics_data = {
        "roc_auc": round(roc_auc, 6),
        "pr_auc": round(pr_auc, 6),
        "precision": round(precision, 6),
        "recall": round(recall, 6),
        "f1_score": round(f1, 6),
        "confusion_matrix": {
            "true_negatives": int(tn),
            "false_positives": int(fp),
            "false_negatives": int(fn),
            "true_positives": int(tp)
        },
        "false_positive_rate": round(fpr, 6),
        "false_negative_rate": round(fnr, 6),
        "classification_threshold": threshold
    }

    metrics_path = os.path.join(artifacts_dir, 'metrics.json')
    with open(metrics_path, 'w') as f:
        json.dump(metrics_data, f, indent=2)
    print(f"Metrics saved to {metrics_path}")

    print("Step 8: Documenting Feature Schema...")
    feature_schema_data = {
        "selectedFeatures": feature_cols,
        "categoricalEncodings": encoding_map,
        "targetColumn": TARGET_COL,
        "idColumn": ID_COL,
        "timeColumn": TIME_COL,
        "featureCount": len(feature_cols)
    }
    feature_schema_path = os.path.join(artifacts_dir, 'feature_schema.json')
    with open(feature_schema_path, 'w') as f:
        json.dump(feature_schema_data, f, indent=2)
    print(f"Feature schema saved to {feature_schema_path}")

    print("Step 9: Calculating Feature Importance...")
    booster = model.get_booster()
    score_gain = booster.get_score(importance_type='gain')
    
    # Build importance dict for all features
    all_importances = {}
    for col in feature_cols:
        # XGBoost booster uses f0, f1... or feature names if present
        all_importances[col] = float(score_gain.get(col, 0.0))

    sorted_importances = sorted(all_importances.items(), key=lambda x: x[1], reverse=True)
    top_20 = [{"feature": k, "importance": round(v, 4)} for k, v in sorted_importances[:20]]

    importance_data = {
        "top_20_features": top_20,
        "all_importances": {k: round(v, 4) for k, v in sorted_importances}
    }
    importance_path = os.path.join(artifacts_dir, 'feature_importance.json')
    with open(importance_path, 'w') as f:
        json.dump(importance_data, f, indent=2)
    print(f"Feature importance saved to {importance_path}")

    print("Step 10: Saving Model Metadata...")
    metadata = {
        "modelVersion": "Nexora Fraud Detection Model v1",
        "datasetName": "IEEE-CIS Fraud Detection Dataset",
        "trainingRows": len(train_df),
        "validationRows": len(val_df),
        "testRows": len(test_df),
        "featureCount": len(feature_cols),
        "fraudRate": round(overall_fraud_rate, 6),
        "trainingFraudRate": round(train_fraud_rate, 6),
        "algorithm": "XGBoost (XGBClassifier)",
        "scalePosWeight": round(scale_pos_weight, 4),
        "trainingDate": datetime.now(timezone.utc).isoformat(),
        "temporalSplit": {
            "train_dt_range": [int(train_df[TIME_COL].min()), int(train_df[TIME_COL].max())],
            "val_dt_range": [int(val_df[TIME_COL].min()), int(val_df[TIME_COL].max())],
            "test_dt_range": [int(test_df[TIME_COL].min()), int(test_df[TIME_COL].max())]
        },
        "metrics": metrics_data,
        "modelArtifact": "ml-training/artifacts/nexora_fraud_v1.json",
        "featureSchema": "ml-training/artifacts/feature_schema.json"
    }

    metadata_path = os.path.join(artifacts_dir, 'model_metadata.json')
    with open(metadata_path, 'w') as f:
        json.dump(metadata, f, indent=2)
    print(f"Model metadata saved to {metadata_path}")

    print("\n================ TRAINING SUMMARY ================")
    print(f"ROC-AUC: {roc_auc:.4f}")
    print(f"PR-AUC: {pr_auc:.4f}")
    print(f"Precision: {precision:.4f}")
    print(f"Recall: {recall:.4f}")
    print(f"F1 Score: {f1:.4f}")
    print("==================================================\n")

if __name__ == '__main__':
    train_and_evaluate()
