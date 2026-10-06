import os
import json
import subprocess
from predict_single import predict_single

def test_numerical_parity():
    # Sample transaction payload
    test_payload = {
        "transactionId": "TXN-PARITY-TEST-001",
        "merchantId": "MERCHANT-001",
        "customerId": "CUST-999",
        "amount": 2850.50,
        "TransactionAmt": 2850.50,
        "ProductCD": "W",
        "card1": 12500,
        "card2": 222,
        "card4": "visa",
        "card6": "debit",
        "P_emaildomain": "gmail.com",
        "R_emaildomain": "gmail.com",
        "TransactionDT": 13155000,
        "ipAddress": "192.168.1.10",
        "deviceId": "DEV-TEST-99"
    }

    # 1. Direct Python Inference
    py_result = predict_single(json.dumps(test_payload))
    py_prob = py_result["fraudProbability"]

    # 2. Nexora Backend RiskModelService via temp file TS execution
    ts_file = "ml-training/src/temp_parity_test.ts"
    ts_code = f"""import {{ RiskModelService }} from '../../artifacts/api-server/src/sentinel/models/riskModel.service';
const payload = {json.dumps(test_payload)};
const res = RiskModelService.predict(payload);
console.log('RESULT_START:' + JSON.stringify(res));
"""
    with open(ts_file, "w", encoding="utf-8") as f:
        f.write(ts_code)

    try:
        res = subprocess.run(["npx", "tsx", ts_file], capture_output=True, text=True, shell=True)
        if 'RESULT_START:' not in res.stdout:
            print("❌ Node.js execution output:", res.stdout)
            print("❌ Node.js execution error:", res.stderr)
            raise RuntimeError(res.stderr)

        result_line = [line for line in res.stdout.split('\n') if 'RESULT_START:' in line][0]
        json_str = result_line.split('RESULT_START:')[1].strip()
        node_res = json.loads(json_str)
        node_prob = node_res["fraudProbability"]
    finally:
        if os.path.exists(ts_file):
            os.remove(ts_file)

    diff = abs(py_prob - node_prob)

    print("==================================================")
    print("NUMERICAL PARITY VERIFICATION REPORT")
    print("==================================================")
    print(f"Transaction ID:        {test_payload['transactionId']}")
    print(f"Python Model Prob:     {py_prob:.6f}")
    print(f"Nexora Backend Prob:   {node_prob:.6f}")
    print(f"Absolute Difference:   {diff:.6f}")
    print(f"Model Version:         {node_res['modelVersion']}")
    print(f"Model Name:            {node_res['modelName']}")
    print("==================================================")

    if diff < 1e-6:
        print("✅ PARITY TEST PASSED: EXACT 0.000000 NUMERICAL MATCH!")
    else:
        print(f"❌ PARITY TEST FAILED: Difference {diff} exceeds threshold!")

    assert diff < 1e-6, "Probabilities do not match!"

if __name__ == '__main__':
    test_numerical_parity()
