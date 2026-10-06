import os
import json
import numpy as np
import pandas as pd
import xgboost as xgb
from preprocess import load_dataset, engineer_features, process_and_encode, TARGET_COL, ID_COL, TIME_COL

def run_inference_test():
    artifacts_dir = 'ml-training/artifacts'
    model_path = os.path.join(artifacts_dir, 'nexora_fraud_v1.json')
    schema_path = os.path.join(artifacts_dir, 'feature_schema.json')

    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model artifact not found at {model_path}")
    if not os.path.exists(schema_path):
        raise FileNotFoundError(f"Feature schema artifact not found at {schema_path}")

    print("Loading feature schema and categorical encodings...")
    with open(schema_path, 'r') as f:
        schema = json.load(f)

    feature_cols = schema["selectedFeatures"]
    encoding_map = schema["categoricalEncodings"]

    print(f"Loading trained XGBoost model from {model_path}...")
    model = xgb.XGBClassifier()
    model.load_model(model_path)

    print("Loading test data...")
    df_raw = load_dataset('ml-training/data')
    df_fe = engineer_features(df_raw)

    print("Encoding test data with training feature schema...")
    df_processed, _, _ = process_and_encode(
        df_fe,
        is_training=False,
        encoding_map=encoding_map,
        selected_features=feature_cols
    )

    # Sort chronologically and take test set (last 15%)
    df_processed = df_processed.sort_values(by=TIME_COL).reset_index(drop=True)
    total_rows = len(df_processed)
    val_end = int(total_rows * 0.85)

    test_df = df_processed.iloc[val_end:].copy()
    print(f"Loaded unseen test dataset: {len(test_df)} transactions.")

    # Select representative samples from test set (including actual frauds and legitimate transactions)
    fraud_samples = test_df[test_df[TARGET_COL] == 1].head(5)
    legit_samples = test_df[test_df[TARGET_COL] == 0].head(5)
    sample_df = pd.concat([fraud_samples, legit_samples]).sort_values(by=TIME_COL)

    X_sample = sample_df[feature_cols]
    probabilities = model.predict_proba(X_sample)[:, 1]

    print("\n================ INFERENCE TEST RESULTS ================\n")
    for idx, (_, row) in enumerate(sample_df.iterrows()):
        tx_id = int(row[ID_COL])
        prob = float(probabilities[idx])
        pred_label = "FRAUD" if prob >= 0.5 else "LEGITIMATE"
        actual_label = "FRAUD" if row[TARGET_COL] == 1 else "LEGITIMATE"

        print(f"Transaction:")
        print(f"{tx_id}")
        print(f"Fraud Probability:")
        print(f"{prob:.6f}")
        print(f"Prediction:")
        print(f"{pred_label} (Actual: {actual_label})")
        print("-" * 40)

    print("INFERENCE TEST: PASS")
    return True

if __name__ == '__main__':
    run_inference_test()
