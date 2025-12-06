from typing import Dict, Any
import json
from utils.fetch_hazard_data import init_ee, build_hazard_features

# Example usage
if __name__ == "__main__":
    init_ee()  # make sure EE is ready

    bbox_azerbaijan = (44.0, 38.5, 51.5, 42.0)
    features = build_hazard_features(
        lat=40.4093,
        lon=49.8671,
        start="2022-01-01",
        end="2022-01-10",
        bbox=bbox_azerbaijan,
        firms_days=7,
    )
    print(json.dumps(features, indent=2))
