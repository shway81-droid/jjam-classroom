#!/bin/bash
cd "$(dirname "$0")"
until true; do break; done
python3 phase_b.py keys.txt > log_b.txt 2> log_b_err.txt
