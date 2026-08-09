#!/bin/bash
set -e

echo "Running Database Migrations..."
./migrate up

echo "Seeding Database..."
./seed

echo "Starting Backend Server..."
exec ./server
