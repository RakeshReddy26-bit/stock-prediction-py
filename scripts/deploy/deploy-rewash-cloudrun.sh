#!/usr/bin/env bash
set -euo pipefail

# Build and deploy the Rewash backend to Google Cloud Run using gcloud.
# Requirements:
# - gcloud SDK installed and authenticated (gcloud auth login)
# - gcloud project set (gcloud config set project YOUR_PROJECT)
# - Billing enabled and Cloud Run API enabled

if [[ $# -lt 2 ]]; then
  echo "Usage: $0 <path-to-split-rewash-dir> <gcr-region> [service-name]"
  echo "Example: $0 ~/splits/rewash-app-split-*/ us-central1 rewash-backend"
  exit 1
fi

REPO_DIR="$1"
GCR_REGION="$2"  # e.g., us-central1
SERVICE_NAME="${3:-rewash-backend}"

BACKEND_DIR="$REPO_DIR/backend"
if [[ ! -d "$BACKEND_DIR" ]]; then
  echo "Backend directory not found at: $BACKEND_DIR"; exit 1
fi

IMAGE_NAME="${GCR_REGION}-docker.pkg.dev/$(gcloud config get-value project)/${SERVICE_NAME}:$(date +%s)"

pushd "$BACKEND_DIR" >/dev/null
echo "Building Docker image and pushing to Artifact Registry / Container Registry..."

# If there's a Dockerfile in backend/, use it; otherwise try to use template
if [[ -f Dockerfile ]]; then
  docker build -t "$IMAGE_NAME" .
else
  echo "No Dockerfile found in backend/. Please create one or use the template scripts/templates/backend.Dockerfile"
  exit 1
fi

docker push "$IMAGE_NAME"

echo "Deploying to Cloud Run as service: $SERVICE_NAME"
gcloud run deploy "$SERVICE_NAME" --image "$IMAGE_NAME" --region "$GCR_REGION" --platform managed --allow-unauthenticated

popd >/dev/null

echo "Cloud Run deployment finished."
