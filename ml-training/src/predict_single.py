import os
import sys
import json
import numpy as np
import pandas as pd
import xgboost as xgb

def predict_single(input_json_str: str):
    artifacts_dir = 'ml-training/artifacts'
    model_path = os.path.join(artifacts_dir, 'nexora_fraud_v1.json')
    schema_path = os.path.join(artifacts_dir, 'feature_schema.json')

    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model artifact missing at {model_path}")
    if not os.path.exists(schema_path):
        raise FileNotFoundError(f"Feature schema missing at {schema_path}")

    with open(schema_path, 'r') as f:
        schema = json.load(f)

    feature_cols = schema["selectedFeatures"]
    encoding_map = schema["categoricalEncodings"]

    # Load payload
    payload = json.loads(input_json_str)

    # Standardize field mapping from Sentinel payload to IEEE-CIS features
    row_dict = {}

    # Map amount
    raw_amt = float(payload.get('TransactionAmt', payload.get('amount', 100.0)))
    row_dict['TransactionAmt'] = raw_amt
    row_dict['TransactionAmt_log'] = float(np.log1p(raw_amt))
    row_dict['TransactionAmt_decimal'] = float(raw_amt - np.floor(raw_amt))

    # Map TransactionDT
    raw_dt = int(payload.get('TransactionDT', 10000000))
    row_dict['TransactionDT'] = raw_dt
    row_dict['dt_hour'] = int((raw_dt // 3600) % 24)
    row_dict['dt_dayofweek'] = int((raw_dt // (3600 * 24)) % 7)
    row_dict['dt_day'] = int(raw_dt // (3600 * 24))

    # Map email domains
    p_email = str(payload.get('P_emaildomain', payload.get('email', 'gmail.com')))
    r_email = str(payload.get('R_emaildomain', 'gmail.com'))
    row_dict['P_emaildomain'] = p_email
    row_dict['R_emaildomain'] = r_email

    p_bin = p_email.split('.')[0] if '.' in p_email else p_email
    r_bin = r_email.split('.')[0] if '.' in r_email else r_email
    row_dict['P_emaildomain_bin'] = p_bin
    row_dict['R_emaildomain_bin'] = r_bin

    # Map ProductCD and card features
    card1 = payload.get('card1', 10000)
    product_cd = str(payload.get('ProductCD', 'W'))
    row_dict['card1_ProductCD'] = f"{card1}_{product_cd}"

    # Map all required feature_cols
    for col in feature_cols:
        if col in row_dict:
            continue
        if col in payload:
            row_dict[col] = payload[col]
        else:
            row_dict[col] = np.nan

    # Create DataFrame for single sample
    df = pd.DataFrame([row_dict])

    # Encode categorical features according to saved schema
    for col, val_to_code in encoding_map.items():
        if col in df.columns:
            val_str = str(df[col].iloc[0]) if not pd.isna(df[col].iloc[0]) else 'missing'
            df[col] = val_to_code.get(val_str, -1)

    # Ensure all feature_cols exist in exact order
    X = df[feature_cols].copy()

    # Convert numeric columns, clean infinities
    numeric_cols = X.select_dtypes(include=[np.number]).columns
    X[numeric_cols] = X[numeric_cols].replace([np.inf, -np.inf], np.nan)

    # Load model and predict
    model = xgb.XGBClassifier()
    model.load_model(model_path)

    prob = float(model.predict_proba(X)[0, 1])
    predicted_fraud = bool(prob >= 0.5)

    res = {
        "fraudProbability": round(prob, 6),
        "predictedFraud": predicted_fraud,
        "modelVersion": "nexora-fraud-v1",
        "modelSource": "IEEE-CIS-XGBoost",
        "topFeatures": ["V258", "V218", "V70", "V294"]
    }
    return res

if __name__ == '__main__':
    try:
        if len(sys.argv) > 1:
            arg = sys.argv[1]
            if os.path.exists(arg):
                with open(arg, 'r') as f:
                    input_str = f.read()
            else:
                input_str = arg
        else:
            input_str = sys.stdin.read()

        result = predict_single(input_str)
        print(json.dumps(result))
        sys.exit(0)
    except Exception as e:
        err_res = {
            "error": "Fraud model unavailable",
            "message": str(e)
        }
        print(json.dumps(err_res), file=sys.stderr)
        sys.exit(1)
