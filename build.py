# -*- coding: utf-8 -*-
import os
OUT_DIR = "docs/architecture-diagrams"
os.makedirs(OUT_DIR, exist_ok=True)
print("CWD:", os.getcwd())
print("OUT_DIR:", os.path.abspath(OUT_DIR))
print("OK")
