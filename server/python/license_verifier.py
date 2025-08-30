import json
from datetime import datetime
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
from cryptography.hazmat.primitives import serialization
import pytz
import sys


def verify_license(pem_path, lic_path):
    try:
        # Load public key
        with open(pem_path, "rb") as f:
            public_key = serialization.load_pem_public_key(f.read())

        # Load license file
        with open(lic_path, "rb") as f:
            license_package = json.loads(f.read().decode())

        data = license_package["data"]
        signature = bytes.fromhex(license_package["signature"])

        # Verify signature integrity
        try:
            public_key.verify(signature, json.dumps(data).encode())
        except Exception:
            return {
                "status": "invalid",
                "message": "❌ License file has been tampered!",
                "start_date": None,
                "end_date": None,
                "region": None
            }

        # Get current machine ID from license
        current_machine_id = data.get("machine_id", "")

        # Validate machine ID
        if data["machine_id"] != current_machine_id:
            return {
                "status": "invalid",
                "message": "❌ License is not valid for this machine!",
                "start_date": data.get("start_date"),
                "end_date": data.get("end_date"),
                "region": data.get("region")
            }

        # Check license validity window
        tz = pytz.timezone(data["region"])
        now = datetime.now(tz)
        start_date = tz.localize(datetime.strptime(data["start_date"], "%d-%m-%Y"))
        end_date = tz.localize(datetime.strptime(data["end_date"], "%d-%m-%Y").replace(hour=23, minute=59, second=59))

        if now < start_date:
            return {
                "status": "inactive",
                "message": f"❌ License not active until {data['start_date']}!",
                "start_date": data["start_date"],
                "end_date": data["end_date"],
                "region": data["region"]
            }
        elif now > end_date:
            return {
                "status": "expired",
                "message": f"❌ License expired on {data['end_date']}!",
                "start_date": data["start_date"],
                "end_date": data["end_date"],
                "region": data["region"]
            }
        else:
            return {
                "status": "valid",
                "message": f"✅ License valid from {data['start_date']} to {data['end_date']} ({data['region']})",
                "start_date": data["start_date"],
                "end_date": data["end_date"],
                "region": data["region"]
            }

    except Exception as e:
        return {
            "status": "invalid",
            "message": f"❌ Error verifying license: {str(e)}",
            "start_date": None,
            "end_date": None,
            "region": None
        }


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print(json.dumps({
            "status": "invalid",
            "message": "Usage: license_verifier <public_key.pem> <license.lic>",
            "start_date": None,
            "end_date": None,
            "region": None
        }))
        sys.exit(1)

    result = verify_license(sys.argv[1], sys.argv[2])
    print(json.dumps(result))
