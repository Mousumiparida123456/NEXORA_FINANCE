import os
import json
import numpy as np
import pandas as pd
from typing import Tuple, Dict, List, Any

# Target & ID variables to exclude from feature matrix
TARGET_COL = 'isFraud'
ID_COL = 'TransactionID'
TIME_COL = 'TransactionDT'

CATEGORICAL_COLS_BASE = [
    'ProductCD', 'card1', 'card2', 'card3', 'card4', 'card5', 'card6',
    'addr1', 'addr2', 'P_emaildomain', 'R_emaildomain',
    'M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9',
    'P_emaildomain_bin', 'R_emaildomain_bin', 'card1_ProductCD'
]

IDENTITY_CATEGORICAL_COLS = [
    'DeviceType', 'DeviceInfo',
    'id_12', 'id_13', 'id_14', 'id_15', 'id_16', 'id_17', 'id_18', 'id_19',
    'id_20', 'id_21', 'id_22', 'id_23', 'id_24', 'id_25', 'id_26', 'id_27',
    'id_28', 'id_29', 'id_30', 'id_31', 'id_32', 'id_33', 'id_34', 'id_35',
    'id_36', 'id_37', 'id_38'
]

EMAIL_VENDOR_MAP = {
    'gmail.com': 'google', 'gmail': 'google', 'gmx.de': 'other',
    'hotmail.com': 'microsoft', 'outlook.com': 'microsoft', 'msn.com': 'microsoft', 'live.com': 'microsoft',
    'yahoo.com': 'yahoo', 'ymail.com': 'yahoo', 'yahoo.com.mx': 'yahoo',
    'aol.com': 'aol', 'icloud.com': 'apple', 'att.net': 'att', 'comcast.net': 'comcast'
}

def parse_email_vendor(domain):
    if pd.isna(domain) or not isinstance(domain, str):
        return 'missing'
    domain_lower = domain.lower()
    return EMAIL_VENDOR_MAP.get(domain_lower, domain_lower.split('.')[0])

def load_dataset(data_dir: str) -> pd.DataFrame:
    """Load train_transaction.csv and conditionally merge train_identity.csv if present."""
    trans_path = os.path.join(data_dir, 'train_transaction.csv')
    ident_path = os.path.join(data_dir, 'train_identity.csv')

    if not os.path.exists(trans_path):
        raise FileNotFoundError(f"Transaction data file not found at: {trans_path}")

    print(f"Loading transaction dataset from {trans_path}...")
    df_trans = pd.read_csv(trans_path)
    print(f"Loaded train_transaction: shape {df_trans.shape}")

    if os.path.exists(ident_path):
        print(f"Loading identity dataset from {ident_path}...")
        df_ident = pd.read_csv(ident_path)
        print(f"Loaded train_identity: shape {df_ident.shape}")
        df = df_trans.merge(df_ident, on=ID_COL, how='left')
        print(f"Joined transaction and identity dataset: shape {df.shape}")
    else:
        print("Identity file train_identity.csv not found; using transaction dataset only.")
        df = df_trans

    return df

def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """Engineer temporal, transaction amount, domain, and interaction features."""
    df = df.copy()

    # 1. Temporal features (TransactionDT is timedelta in seconds)
    df['dt_hour'] = (df[TIME_COL] // 3600) % 24
    df['dt_dayofweek'] = (df[TIME_COL] // (3600 * 24)) % 7
    df['dt_day'] = (df[TIME_COL] // (3600 * 24))

    # 2. Transaction Amount features
    df['TransactionAmt_log'] = np.log1p(df['TransactionAmt'])
    df['TransactionAmt_decimal'] = df['TransactionAmt'] - np.floor(df['TransactionAmt'])

    # 3. Email Domain features
    df['P_emaildomain_bin'] = df['P_emaildomain'].apply(parse_email_vendor)
    df['R_emaildomain_bin'] = df['R_emaildomain'].apply(parse_email_vendor)

    # 4. Feature Interactions
    df['card1_ProductCD'] = df['card1'].astype(str) + '_' + df['ProductCD'].astype(str)

    # 5. Handle infinite values
    numeric_cols = df.select_dtypes(include=[np.number]).columns
    df[numeric_cols] = df[numeric_cols].replace([np.inf, -np.inf], np.nan)

    return df

def process_and_encode(
    df: pd.DataFrame,
    is_training: bool = True,
    encoding_map: Dict[str, Dict[str, int]] = None,
    selected_features: List[str] = None
) -> Tuple[pd.DataFrame, Dict[str, Dict[str, int]], List[str]]:
    """
    Encode categorical features and select final model feature set.
    """
    df = df.copy()
    if encoding_map is None:
        encoding_map = {}

    # Identify all categorical columns in dataset
    all_cat_cols = [col for col in CATEGORICAL_COLS_BASE + IDENTITY_CATEGORICAL_COLS if col in df.columns]

    for col in all_cat_cols:
        df[col] = df[col].astype(str).fillna('missing')
        
        if is_training:
            unique_vals = sorted(df[col].unique().tolist())
            val_to_code = {val: idx for idx, val in enumerate(unique_vals)}
            encoding_map[col] = val_to_code
        else:
            val_to_code = encoding_map.get(col, {})
        
        # Map values; unknown values get -1
        df[col] = df[col].map(lambda x: val_to_code.get(x, -1)).astype(int)

    # Determine feature selection if training
    if is_training:
        exclude_cols = {TARGET_COL, ID_COL, TIME_COL}
        # Filter out columns with > 90% missing values if numerical
        missing_ratios = df.isnull().mean()
        high_missing_cols = missing_ratios[missing_ratios > 0.90].index.tolist()
        
        feature_cols = [c for c in df.columns if c not in exclude_cols and c not in high_missing_cols]
    else:
        feature_cols = selected_features

    return df, encoding_map, feature_cols

if __name__ == '__main__':
    data_dir = 'ml-training/data'
    df_raw = load_dataset(data_dir)
    df_fe = engineer_features(df_raw)
    df_encoded, cat_map, feat_cols = process_and_encode(df_fe, is_training=True)
    print(f"Processed dataset shape: {df_encoded.shape}")
    print(f"Selected feature count: {len(feat_cols)}")
