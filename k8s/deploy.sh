#!/bin/bash
set -e

minikube image build -t url-shortener:latest .

kubectl create secret generic server-secret \
  --from-env-file=.env.k8s.secret \
  --dry-run=client -o yaml | kubectl apply -f -

kubectl apply -f k8s/minikube/

kubectl rollout restart deployment/server
kubectl rollout status deployment/server