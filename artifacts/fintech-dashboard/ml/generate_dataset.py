import os
import csv
import random
import math

def generate_synthetic_transactions(num_samples=20000, seed=42):
    random.seed(seed)
    
    output_dir = os.path.join(os.path.dirname(__file__), "data")
    os.makedirs(output_dir, exist_ok=True)
    csv_path = os.path.join(output_dir, "transactions.csv")
    
    headers = [
        "transaction_amount",
        "transaction_hour",
        "customer_age",
        "customer_transaction_count",
        "customer_avg_transaction_amount",
        "customer_failed_payment_count",
        "customer_chargeback_count",
        "transactions_last_10_minutes",
        "transactions_last_1_hour",
        "account_age_days",
        "distance_from_billing_location",
        "ip_country_match",
        "device_trust_score",
        "new_device",
        "new_ip",
        "payment_method_age_days",
        "card_bin_risk",
        "merchant_risk_score",
        "previous_fraud_flag",
        "velocity_score",
        "is_fraud"
    ]
    
    rows = []
    
    # Generate 95% legit (~19,000), 5% fraud (~1,000)
    num_fraud = int(num_samples * 0.05)
    num_legit = num_samples - num_fraud
    
    # 1. Legitimate Transactions
    for i in range(num_legit):
        amount = round(random.uniform(10.0, 450.0), 2)
        hour = random.randint(7, 22)
        customer_age = random.randint(21, 65)
        txn_count = random.randint(5, 120)
        avg_amount = round(random.uniform(30.0, 300.0), 2)
        failed_count = random.choices([0, 1, 2], weights=[0.85, 0.12, 0.03])[0]
        chargeback_count = 0 if random.random() > 0.02 else 1
        txns_10m = random.choices([0, 1], weights=[0.9, 0.1])[0]
        txns_1h = random.randint(0, 3)
        account_age = random.randint(30, 1500)
        distance = round(random.expovariate(1 / 15.0), 2)
        ip_match = 1 if random.random() > 0.04 else 0
        trust_score = random.randint(70, 99)
        new_device = 1 if random.random() < 0.15 else 0
        new_ip = 1 if random.random() < 0.20 else 0
        pm_age = random.randint(15, 800)
        bin_risk = round(random.uniform(0.01, 0.25), 3)
        merchant_risk = round(random.uniform(0.02, 0.20), 3)
        prev_fraud = 0 if random.random() > 0.005 else 1
        velocity = round(random.uniform(0.0, 2.5), 2)
        
        rows.append([
            amount, hour, customer_age, txn_count, avg_amount, failed_count, chargeback_count,
            txns_10m, txns_1h, account_age, distance, ip_match, trust_score, new_device,
            new_ip, pm_age, bin_risk, merchant_risk, prev_fraud, velocity, 0
        ])
        
    # 2. Fraudulent Transactions (correlated risk signals)
    for i in range(num_fraud):
        amount = round(random.choice([random.uniform(2000.0, 25000.0), random.uniform(850.0, 4900.0)]), 2)
        hour = random.choice([1, 2, 3, 4, 23, random.randint(0, 23)])
        customer_age = random.randint(18, 55)
        txn_count = random.randint(1, 15)
        avg_amount = round(random.uniform(20.0, 150.0), 2)
        failed_count = random.randint(2, 8)
        chargeback_count = random.randint(1, 5)
        txns_10m = random.randint(3, 12)
        txns_1h = random.randint(5, 25)
        account_age = random.randint(1, 20)
        distance = round(random.uniform(800.0, 9500.0), 2)
        ip_match = 0 if random.random() < 0.85 else 1
        trust_score = random.randint(10, 45)
        new_device = 1 if random.random() < 0.88 else 0
        new_ip = 1 if random.random() < 0.92 else 0
        pm_age = random.randint(1, 10)
        bin_risk = round(random.uniform(0.65, 0.98), 3)
        merchant_risk = round(random.uniform(0.50, 0.95), 3)
        prev_fraud = 1 if random.random() < 0.65 else 0
        velocity = round(random.uniform(6.0, 18.0), 2)
        
        rows.append([
            amount, hour, customer_age, txn_count, avg_amount, failed_count, chargeback_count,
            txns_10m, txns_1h, account_age, distance, ip_match, trust_score, new_device,
            new_ip, pm_age, bin_risk, merchant_risk, prev_fraud, velocity, 1
        ])
        
    # Shuffle dataset
    random.shuffle(rows)
    
    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(headers)
        writer.writerows(rows)
        
    print(f"Generated {len(rows)} synthetic transactions saved to {csv_path}")

if __name__ == "__main__":
    generate_synthetic_transactions()
