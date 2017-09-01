#!/usr/bin/env bash
set -e

# Reduce npm logging
npm config set loglevel warn
npm install -g marked

pushd Lambda


for directory in $(ls -d */ | sed 's#/##'); do
  echo "Building: $directory"
  pushd $directory

  rm -f *.zip || true

  for f in $(ls -d */ | sed 's#/##'); do
    echo "Building $f"
    pushd $f
    npm install
    popd
    echo "Zipping $f"
    zip -q -9 -r ../../../PackagedLambdas/$f.zip $f/*
  done

  popd
done

popd
