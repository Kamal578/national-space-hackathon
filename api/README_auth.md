# 🌍 Earth Engine Service Account Authentication Guide

### How to Create and Use a JSON Key for Automated (Non-Interactive) GEE Access

This guide explains how to set up **Google Earth Engine authentication using a Service Account + JSON key**, so your backend or scripts can run *without* browser login or manual `ee.Authenticate()` calls.

This is the recommended approach for:

* Automated pipelines
* Server-side workloads
* Hackathon projects that need clean repeatable execution
* Deployments on Docker, Render, Fly.io, AWS, GCP, etc.

---

# ✅ 1. Create a Google Cloud Project

Go to → [https://console.cloud.google.com/](https://console.cloud.google.com/)

1. Click the project dropdown
2. Click **New Project**
3. Name it (e.g., `hackathon-demo`)
4. Note your **Project ID** (e.g. `hackathon-demo-480416`)

---

# ✅ 2. Enable the Earth Engine API

Inside your project:

1. Left sidebar → **APIs & Services → Library**
2. Search for **Earth Engine API**
3. Click **Enable**

---

# ✅ 3. Create a Service Account

Left sidebar → **IAM & Admin → Service Accounts**

1. Click **Create Service Account**

2. Name it, e.g.:

   ```
   earthengine-sa
   ```

3. Click **Create and Continue**

### Assign a role:

For now (prototype phase), choose:

```
Editor
```

*(You can restrict permissions later.)*

4. Click **Done**

---

# ✅ 4. Create and Download a JSON Key

1. Click your newly created Service Account
2. Go to **Keys** tab
3. Click **Add Key → Create New Key**
4. Choose **JSON**
5. Save the file → move it into your project:

```
/your-project/keys/earthengine-sa.json
```

⚠️ **VERY IMPORTANT**

* Never commit this file to GitHub
* Add this to `.gitignore`:

```
keys/*.json
```

---

# ✅ 5. Give the Service Account Access to Earth Engine

Go to → [https://code.earthengine.google.com/](https://code.earthengine.google.com/)

1. Click your username in top-right
2. Select **Manage Account**
3. Go to **Cloud Projects**
4. Add your GCP Project ID, e.g.:

```
hackathon-demo-480416
```

5. Now grant the Service Account access to Earth Engine:

Under **Users with access**, add:

```
earthengine-sa@hackathon-demo-480416.iam.gserviceaccount.com
```

Assign role:

```
Writer (or Editor)
```

Without this step, authentication will **fail even with the JSON key**.

---

# ✅ 6. Use the JSON Key in Python

Install dependencies:

```bash
pip install earthengine-api google-auth
```

Then create an `ee_auth.py`:

```python
import ee
from google.oauth2 import service_account
import os

def init_ee():
    SERVICE_ACCOUNT = "earthengine-sa@hackathon-demo-480416.iam.gserviceaccount.com"
    KEY_PATH = "keys/earthengine-sa.json"

    credentials = service_account.Credentials.from_service_account_file(
        KEY_PATH,
        scopes=[
            "https://www.googleapis.com/auth/earthengine",
            "https://www.googleapis.com/auth/cloud-platform",
        ],
    )

    ee.Initialize(credentials, project="hackathon-demo-480416")
    print("🌍 Earth Engine initialized (service account)")
```

Use it in any script:

```python
from ee_auth import init_ee

init_ee()

import ee
print(ee.Number(7).multiply(6).getInfo())  # test
```

You should see:

```
🌍 Earth Engine initialized (service account)
42
```

🎉 You now have **fully automated**, **non-interactive** Earth Engine access.

---

# 🚀 Optional: Secure Deployment

For production:

* Store JSON key in a secret manager (GitHub Actions Secrets, GCP Secret Manager, Docker secrets)
* Do **not** commit the key file
* Load via environment variables (recommended)

Example:

```bash
export EE_KEY=$(cat keys/earthengine-sa.json)
```

---

# 🎯 You're Ready to Run CHIRPS / EE Queries Programmatically

With the JSON key + service account setup, your scripts can now:

* Run CHIRPS rainfall extraction
* Fetch EO rasters
* Run ImageCollection operations
* Build automated hazard pipelines

No browser login. No token refreshing. No manual step.
