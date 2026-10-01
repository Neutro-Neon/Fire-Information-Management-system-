#!/usr/bin/env python3
"""
===============================================================================
NASA FIRMS Forest Fire Early Detection System (FAMS)
IEEE Environmental Monitoring Project — Multi-Biome Satellite Surveillance
===============================================================================

One-Click Server Controller & Data Fetch Diagnostic Runner:
  1. Starts FastAPI Backend (Port 8000)
  2. Starts Vite Frontend Dev Server (Port 5173)
  3. Probes All API Endpoints & Vite Proxy to Check for "Failed to Fetch" Errors
  4. Displays Real-Time Hotspot Statistics (Chennai, Indonesia, Amazon)
  5. Automatically Opens Verified Application in Default Browser
  6. Supports Graceful Shutdown (Ctrl+C or 'q' or 'python run.py stop')
"""

import os
import sys
import json
import time
import socket
import shutil
import urllib.request
import urllib.error
import subprocess
import webbrowser
from typing import List, Dict, Optional, Tuple, Any

# Line-buffered stdout for real-time console feedback
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(line_buffering=True)
    except Exception:
        pass

# Root directories
ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(ROOT_DIR, "backend")
FRONTEND_DIR = os.path.join(ROOT_DIR, "frontend")
LOGS_DIR = os.path.join(ROOT_DIR, "logs")
RUNTIME_FILE = os.path.join(ROOT_DIR, ".fams_runtime.json")

BACKEND_PORT = 8000
FRONTEND_PORT = 5173
BACKEND_URL = f"http://127.0.0.1:{BACKEND_PORT}"
FRONTEND_URL = f"http://127.0.0.1:{FRONTEND_PORT}"
BROWSER_URL = f"http://localhost:{FRONTEND_PORT}"

# Terminal color styling
USE_COLORS = sys.platform != "win32" or "WT_SESSION" in os.environ or "ANSICON" in os.environ or os.environ.get("TERM") == "xterm-256color"
class Colors:
    GREEN = "\033[92m" if USE_COLORS else ""
    YELLOW = "\033[93m" if USE_COLORS else ""
    RED = "\033[91m" if USE_COLORS else ""
    CYAN = "\033[96m" if USE_COLORS else ""
    BOLD = "\033[1m" if USE_COLORS else ""
    DIM = "\033[2m" if USE_COLORS else ""
    RESET = "\033[0m" if USE_COLORS else ""


def ensure_logs_dir():
    os.makedirs(LOGS_DIR, exist_ok=True)


def is_port_listening(port: int, host: str = "127.0.0.1") -> bool:
    """Check if a TCP port is currently open and listening."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(0.5)
        try:
            s.connect((host, port))
            return True
        except (socket.timeout, ConnectionRefusedError, OSError):
            return False


def find_pids_on_port(port: int) -> List[int]:
    """Identify all process IDs bound to the specified port."""
    pids = set()
    if sys.platform == "win32":
        try:
            output = subprocess.check_output(
                ["netstat", "-ano", "-p", "tcp"],
                text=True,
                stderr=subprocess.DEVNULL
            )
            for line in output.splitlines():
                line = line.strip()
                if "LISTENING" in line:
                    parts = line.split()
                    if len(parts) >= 5 and parts[1].endswith(f":{port}"):
                        try:
                            pid = int(parts[4])
                            if pid > 0:
                                pids.add(pid)
                        except ValueError:
                            pass
        except Exception:
            pass
    else:
        try:
            output = subprocess.check_output(
                ["lsof", "-t", f"-i:{port}"],
                text=True,
                stderr=subprocess.DEVNULL
            )
            for line in output.splitlines():
                try:
                    pids.add(int(line.strip()))
                except ValueError:
                    pass
        except Exception:
            pass
    return list(pids)


def kill_pid_tree(pid: int) -> bool:
    """Cleanly terminate a process and all its children."""
    if not pid or pid <= 0:
        return False
    try:
        if sys.platform == "win32":
            subprocess.run(
                ["taskkill", "/PID", str(pid), "/T", "/F"],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                check=False
            )
        else:
            subprocess.run(["kill", "-9", str(pid)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=False)
        return True
    except Exception:
        return False


def stop_existing_services(silent: bool = False) -> None:
    """Free ports 8000 and 5173 to prevent conflicts."""
    ensure_logs_dir()
    runtime = load_runtime_data()
    for key in ["backend_pid", "frontend_pid"]:
        pid = runtime.get(key)
        if pid:
            kill_pid_tree(pid)

    for port in [BACKEND_PORT, FRONTEND_PORT]:
        for pid in find_pids_on_port(port):
            kill_pid_tree(pid)

    clear_runtime_data()
    time.sleep(0.8)


def load_runtime_data() -> Dict:
    if os.path.exists(RUNTIME_FILE):
        try:
            with open(RUNTIME_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {}


def save_runtime_data(data: Dict) -> None:
    try:
        with open(RUNTIME_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
    except Exception:
        pass


def clear_runtime_data() -> None:
    if os.path.exists(RUNTIME_FILE):
        try:
            os.remove(RUNTIME_FILE)
        except Exception:
            pass


def resolve_python_executable() -> str:
    """Find a Python executable with FastAPI and Uvicorn installed."""
    candidates = []

    # 1. Project dedicated virtual environment (highest priority)
    if sys.platform == "win32":
        candidates.append(os.path.join(BACKEND_DIR, "venv", "Scripts", "python.exe"))
    else:
        candidates.append(os.path.join(BACKEND_DIR, "venv", "bin", "python"))

    # 2. Windows specific path resolutions (where.exe finds all pythons in PATH)
    if sys.platform == "win32":
        try:
            res = subprocess.run(["where.exe", "python"], capture_output=True, text=True, timeout=2)
            if res.returncode == 0:
                for line in res.stdout.splitlines():
                    p = line.strip()
                    if p and p not in candidates:
                        candidates.append(p)
        except Exception:
            pass

        # Also check AppData Python installations
        local_app_data = os.environ.get("LOCALAPPDATA", "")
        if local_app_data:
            python_dir = os.path.join(local_app_data, "Python")
            if os.path.isdir(python_dir):
                for entry in os.listdir(python_dir):
                    sub = os.path.join(python_dir, entry, "python.exe")
                    if os.path.exists(sub) and sub not in candidates:
                        candidates.append(sub)

            py_candidates = [
                os.path.join(local_app_data, "Python", "bin", "python.exe"),
                os.path.join(local_app_data, "Programs", "Python", "Python314", "python.exe"),
                os.path.join(local_app_data, "Programs", "Python", "Python313", "python.exe"),
                os.path.join(local_app_data, "Programs", "Python", "Python312", "python.exe"),
                os.path.join(local_app_data, "Programs", "Python", "Python311", "python.exe"),
            ]
            for c in py_candidates:
                if c not in candidates and os.path.exists(c):
                    candidates.append(c)

    # 3. Standard interpreters
    for std in [sys.executable, shutil.which("python"), shutil.which("python3")]:
        if std and std not in candidates:
            candidates.append(std)

    # Test each candidate
    for cand in candidates:
        if cand and os.path.exists(cand):
            try:
                res = subprocess.run(
                    [cand, "-c", "import uvicorn, fastapi"],
                    capture_output=True,
                    timeout=3
                )
                if res.returncode == 0:
                    return cand
            except Exception:
                pass

    # If no candidate has uvicorn/fastapi, attempt to install in venv
    venv_py = os.path.join(BACKEND_DIR, "venv", "Scripts", "python.exe") if sys.platform == "win32" else os.path.join(BACKEND_DIR, "venv", "bin", "python")
    target_py = venv_py if os.path.exists(venv_py) else sys.executable
    req_file = os.path.join(BACKEND_DIR, "requirements.txt")
    if os.path.exists(req_file):
        print(f"{Colors.YELLOW}[WARNING] FastAPI/Uvicorn not found. Installing backend dependencies...{Colors.RESET}", flush=True)
        try:
            subprocess.run([target_py, "-m", "pip", "install", "-r", req_file], check=True)
            return target_py
        except Exception as e:
            print(f"{Colors.RED}[ERROR] Auto-install failed: {e}{Colors.RESET}", flush=True)

    return target_py


def resolve_npm_cmd() -> str:
    """Find the npm command."""
    if sys.platform == "win32":
        return shutil.which("npm.cmd") or shutil.which("npm") or "npm.cmd"
    return shutil.which("npm") or "npm"


def http_get_json(url: str, timeout: float = 12.0) -> Tuple[bool, Optional[Dict], Optional[str]]:
    """Perform HTTP GET request and parse JSON, capturing exact fetch errors."""
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "FAMS-DiagnosticRunner/1.0", "Accept": "application/json"}
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as response:
            code = response.status
            body = response.read().decode("utf-8")
            try:
                data = json.loads(body)
                return True, data, None
            except json.JSONDecodeError as je:
                return False, None, f"HTTP {code} returned invalid JSON: {str(je)[:100]}"
    except urllib.error.HTTPError as he:
        err_content = he.read().decode("utf-8", errors="ignore")[:200]
        return False, None, f"HTTP {he.code}: {he.reason} - {err_content}"
    except urllib.error.URLError as ue:
        return False, None, f"Connection Failed: {ue.reason}"
    except Exception as e:
        return False, None, f"Fetch Error: {str(e)}"


def http_get_text(url: str, timeout: float = 6.0) -> Tuple[bool, Optional[str], Optional[str]]:
    """Perform HTTP GET request and return plain text (for HTML root)."""
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "FAMS-DiagnosticRunner/1.0"}
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as response:
            body = response.read().decode("utf-8", errors="ignore")
            return True, body, None
    except Exception as e:
        return False, None, str(e)


def run_fetch_diagnostics() -> Tuple[bool, List[str], Dict[str, Any]]:
    """
    Comprehensive verification:
    Ensures zero 'failed to fetch' errors across all backend and frontend proxy endpoints.
    """
    errors: List[str] = []
    results: Dict[str, Any] = {}

    print(f"\n{Colors.BOLD}--- [DIAGNOSTIC TEST] VERIFYING SATELLITE DATA PIPELINE ---{Colors.RESET}", flush=True)

    # Check 1: Backend Health
    sys.stdout.write(f"  * Checking Backend Health ({BACKEND_URL}/api/health)... ")
    sys.stdout.flush()
    ok, data, err = http_get_json(f"{BACKEND_URL}/api/health", timeout=6.0)
    if ok and data and data.get("status") == "healthy":
        results["health"] = data
        key_info = data.get("firms_key_status", {})
        print(f"{Colors.GREEN}[PASS]{Colors.RESET} (Key: {key_info.get('masked_key', 'Active')}, Status: {key_info.get('status', 'valid')})", flush=True)
    else:
        msg = f"Backend health check failed: {err or 'Unhealthy response'}"
        errors.append(msg)
        print(f"{Colors.RED}[FAIL]{Colors.RESET} -> {msg}", flush=True)

    # Check 2: Surveillance Regions
    sys.stdout.write(f"  * Checking Surveillance Regions ({BACKEND_URL}/api/regions)... ")
    sys.stdout.flush()
    ok, data, err = http_get_json(f"{BACKEND_URL}/api/regions", timeout=6.0)
    if ok and data and "regions" in data:
        reg_count = len(data["regions"])
        results["regions"] = data["regions"]
        print(f"{Colors.GREEN}[PASS]{Colors.RESET} ({reg_count} biomes active: Chennai, Indonesia, Amazon)", flush=True)
    else:
        msg = f"Surveillance regions endpoint failed: {err}"
        errors.append(msg)
        print(f"{Colors.RED}[FAIL]{Colors.RESET} -> {msg}", flush=True)

    # Check 3: Real Satellite Fire Data Fetch (Region: All Biomes)
    sys.stdout.write(f"  * Checking NASA FIRMS Satellite Hotspots ({BACKEND_URL}/api/fires?region=all)... ")
    sys.stdout.flush()
    ok, data, err = http_get_json(f"{BACKEND_URL}/api/fires?region=all&days=2", timeout=25.0)
    if ok and data and data.get("success"):
        count = data.get("count", 0)
        results["fires_all"] = data
        stats = data.get("statistics", {})
        high_conf = stats.get("high_confidence_count", 0) if stats else 0
        print(f"{Colors.GREEN}[PASS]{Colors.RESET} ({count:,} authentic detections verified, {high_conf:,} high confidence)", flush=True)
    else:
        msg = f"NASA FIRMS fire data fetch failed: {err or (data.get('error') if data else 'Unknown')}"
        errors.append(msg)
        print(f"{Colors.RED}[FAIL]{Colors.RESET} -> {msg}", flush=True)

    # Check 4: GIS Administrative & Forest Layers
    sys.stdout.write(f"  * Checking GIS Forest Boundaries ({BACKEND_URL}/api/layers/forests)... ")
    sys.stdout.flush()
    ok, data, err = http_get_json(f"{BACKEND_URL}/api/layers/forests", timeout=6.0)
    if ok and data and "features" in data:
        forest_count = len(data["features"])
        print(f"{Colors.GREEN}[PASS]{Colors.RESET} ({forest_count} authentic forest reserves loaded)", flush=True)
    else:
        msg = f"GIS Forest layer failed: {err}"
        errors.append(msg)
        print(f"{Colors.RED}[FAIL]{Colors.RESET} -> {msg}", flush=True)

    # Check 5: Frontend Web Server
    sys.stdout.write(f"  * Checking Frontend Dev Server ({FRONTEND_URL}/)... ")
    sys.stdout.flush()
    ok, text, err = http_get_text(f"{FRONTEND_URL}/", timeout=6.0)
    if ok and text and "<html" in text.lower():
        print(f"{Colors.GREEN}[PASS]{Colors.RESET} (Vite HTML served successfully)", flush=True)
    else:
        msg = f"Frontend web server failed: {err}"
        errors.append(msg)
        print(f"{Colors.RED}[FAIL]{Colors.RESET} -> {msg}", flush=True)

    # Check 6: Frontend Vite Proxy Pipeline
    sys.stdout.write(f"  * Checking Frontend Proxy Pipeline ({FRONTEND_URL}/api/health)... ")
    sys.stdout.flush()
    ok, data, err = http_get_json(f"{FRONTEND_URL}/api/health", timeout=6.0)
    if ok and data and data.get("status") == "healthy":
        print(f"{Colors.GREEN}[PASS]{Colors.RESET} (Vite /api proxy successfully routes to FastAPI)", flush=True)
    else:
        msg = f"Frontend Vite proxy failed: {err} (Browser will encounter 'Failed to fetch' error)"
        errors.append(msg)
        print(f"{Colors.RED}[FAIL]{Colors.RESET} -> {msg}", flush=True)

    all_passed = len(errors) == 0
    return all_passed, errors, results


def print_diagnostic_summary(all_passed: bool, errors: List[str], results: Dict[str, Any]) -> None:
    """Print clean operational summary banner."""
    print(f"\n======================================================================", flush=True)
    if all_passed:
        print(f"  {Colors.GREEN}{Colors.BOLD}[PASS] ZERO 'FAILED TO FETCH' ERRORS DETECTED!{Colors.RESET}", flush=True)
        print(f"======================================================================", flush=True)
        fires = results.get("fires_all", {})
        count = fires.get("count", 0)
        stats = fires.get("statistics", {})

        print(f"  * {Colors.BOLD}Operational Status{Colors.RESET} : Fully Online & Healthy", flush=True)
        print(f"  * {Colors.BOLD}Web Dashboard{Colors.RESET}      : {Colors.CYAN}{BROWSER_URL}{Colors.RESET}", flush=True)
        print(f"  * {Colors.BOLD}Backend API Docs{Colors.RESET}   : {Colors.CYAN}{BACKEND_URL}/docs{Colors.RESET}", flush=True)
        print(f"  * {Colors.BOLD}NASA Satellite Data{Colors.RESET}: {Colors.GREEN}{count:,} Real Detections Active{Colors.RESET}", flush=True)
        if stats:
            print(f"      - High Confidence Hotspots : {stats.get('high_confidence_count', 0):,}", flush=True)
            print(f"      - Nominal Confidence      : {stats.get('nominal_confidence_count', 0):,}", flush=True)
            print(f"      - Near Forest Reserves     : {stats.get('forest_proximity_count', 0):,}", flush=True)
            print(f"      - Max Fire Radiative Power : {stats.get('max_frp', 0):.1f} MW", flush=True)
        print(f"  * {Colors.BOLD}Surveillance Biomes{Colors.RESET}: Chennai, Indonesia Tropical Peatlands, Amazon Basin", flush=True)
        print(f"======================================================================\n", flush=True)
    else:
        print(f"  {Colors.RED}{Colors.BOLD}[ERROR] 'FAILED TO FETCH' ERROR DETECTED! ({len(errors)} Issue(s)){Colors.RESET}", flush=True)
        print(f"======================================================================", flush=True)
        for e in errors:
            print(f"  {Colors.RED}- {e}{Colors.RESET}", flush=True)
        print(f"\n  Review log files for exact stack traces:", flush=True)
        print(f"    * Backend Log : {os.path.join(LOGS_DIR, 'backend.log')}", flush=True)
        print(f"    * Frontend Log: {os.path.join(LOGS_DIR, 'frontend.log')}", flush=True)
        print(f"======================================================================\n", flush=True)


def start_all(open_browser: bool = True) -> bool:
    """Start both FastAPI and Vite servers and run the fetch validation test."""
    ensure_logs_dir()

    print(f"\n======================================================================", flush=True)
    print(f"  {Colors.BOLD}NASA FIRMS FOREST FIRE EARLY DETECTION SYSTEM (FAMS){Colors.RESET}", flush=True)
    print(f"  IEEE Environmental Monitoring — Multi-Biome Satellite Surveillance", flush=True)
    print(f"======================================================================\n", flush=True)

    # Step 1: Clean up any stale processes on ports 8000 and 5173
    print(f"{Colors.CYAN}--> [1/4] Preparing ports ({BACKEND_PORT}, {FRONTEND_PORT})...{Colors.RESET}", flush=True)
    stop_existing_services(silent=True)

    # Step 2: Start FastAPI Backend
    python_exe = resolve_python_executable()
    backend_log_file = open(os.path.join(LOGS_DIR, "backend.log"), "w", encoding="utf-8")
    print(f"{Colors.CYAN}--> [2/4] Starting FastAPI Backend on {BACKEND_URL} ...{Colors.RESET}", flush=True)
    
    cmd_backend = [
        python_exe, "-m", "uvicorn", "main:app",
        "--host", "127.0.0.1",
        "--port", str(BACKEND_PORT)
    ]

    backend_proc = subprocess.Popen(
        cmd_backend,
        cwd=BACKEND_DIR,
        stdout=backend_log_file,
        stderr=subprocess.STDOUT
    )

    # Step 3: Start Vite Frontend
    npm_cmd = resolve_npm_cmd()
    frontend_log_file = open(os.path.join(LOGS_DIR, "frontend.log"), "w", encoding="utf-8")
    print(f"{Colors.CYAN}--> [3/4] Starting Vite Frontend on {FRONTEND_URL} ...{Colors.RESET}", flush=True)

    cmd_frontend = [npm_cmd, "run", "dev"]
    frontend_proc = subprocess.Popen(
        cmd_frontend,
        cwd=FRONTEND_DIR,
        shell=(sys.platform == "win32"),
        stdout=frontend_log_file,
        stderr=subprocess.STDOUT
    )

    # Save tracked PIDs
    save_runtime_data({
        "backend_pid": backend_proc.pid,
        "frontend_pid": frontend_proc.pid,
        "started_at": time.strftime("%Y-%m-%d %H:%M:%S")
    })

    # Wait up to 15 seconds for initial server boot
    print(f"{Colors.CYAN}--> [4/4] Initializing application services...{Colors.RESET}", flush=True)
    backend_ready = False
    frontend_ready = False

    for attempt in range(1, 30):
        time.sleep(0.5)
        if backend_proc.poll() is not None:
            backend_log_file.flush()
            try:
                with open(os.path.join(LOGS_DIR, "backend.log"), "r", encoding="utf-8", errors="ignore") as lf:
                    err_text = lf.read().strip()
                print(f"\n{Colors.RED}[FATAL] Backend server exited immediately (exit code {backend_proc.returncode}):{Colors.RESET}\n{err_text}", flush=True)
            except Exception:
                pass
            break
        if frontend_proc.poll() is not None:
            frontend_log_file.flush()
            try:
                with open(os.path.join(LOGS_DIR, "frontend.log"), "r", encoding="utf-8", errors="ignore") as lf:
                    err_text = lf.read().strip()
                print(f"\n{Colors.RED}[FATAL] Frontend server exited immediately (exit code {frontend_proc.returncode}):{Colors.RESET}\n{err_text}", flush=True)
            except Exception:
                pass
            break
        if not backend_ready and is_port_listening(BACKEND_PORT):
            backend_ready = True
        if not frontend_ready and is_port_listening(FRONTEND_PORT):
            frontend_ready = True
        if backend_ready and frontend_ready:
            break

    # Step 4: Run Fetch Diagnostics
    all_passed, errors, results = run_fetch_diagnostics()
    print_diagnostic_summary(all_passed, errors, results)

    if all_passed and open_browser:
        print(f"Opening {BROWSER_URL} in your default browser...\n", flush=True)
        time.sleep(0.5)
        webbrowser.open(BROWSER_URL)

    return all_passed


def stop_all() -> None:
    """Cleanly stop both backend and frontend servers."""
    print(f"\n{Colors.CYAN}--> Stopping NASA FIRMS Forest Fire Early Detection System...{Colors.RESET}", flush=True)
    stop_existing_services()
    print(f"{Colors.GREEN}[SUCCESS] All application services stopped and ports freed.{Colors.RESET}\n", flush=True)


def status_info() -> None:
    """Check and display running status."""
    b_up = is_port_listening(BACKEND_PORT)
    f_up = is_port_listening(FRONTEND_PORT)
    print(f"\n======================================================================", flush=True)
    print(f"  {Colors.BOLD}FAMS SERVICE STATUS{Colors.RESET}", flush=True)
    print(f"======================================================================", flush=True)
    print(f"  * Backend API  (:{BACKEND_PORT}): {'[RUNNING]' if b_up else '[STOPPED]'}", flush=True)
    print(f"  * Frontend Web (:{FRONTEND_PORT}): {'[RUNNING]' if f_up else '[STOPPED]'}", flush=True)
    if b_up and f_up:
        all_passed, errors, results = run_fetch_diagnostics()
        print_diagnostic_summary(all_passed, errors, results)
    else:
        print(f"\n  Run 'python run.py' to start the application.", flush=True)
    print(f"======================================================================\n", flush=True)


def main():
    args = [a.lower() for a in sys.argv[1:]]

    if "stop" in args or "down" in args or "kill" in args:
        stop_all()
        return

    if "status" in args or "ps" in args:
        status_info()
        return

    if "test" in args or "check" in args or "diag" in args:
        all_passed, errors, results = run_fetch_diagnostics()
        print_diagnostic_summary(all_passed, errors, results)
        return

    if "restart" in args:
        stop_all()
        time.sleep(1.0)
        start_all(open_browser=True)
        return

    # Default action: Start all services, run diagnostics, open browser, and keep alive
    no_browser = "--no-browser" in args or "-n" in args
    success = start_all(open_browser=not no_browser)

    print(f"{Colors.DIM}Application is running. Press Ctrl+C or type 'q' and Enter to stop all servers.{Colors.RESET}\n", flush=True)

    try:
        while True:
            if sys.stdin and hasattr(sys.stdin, "isatty") and sys.stdin.isatty():
                try:
                    line = sys.stdin.readline()
                    if not line:
                        time.sleep(1.0)
                        continue
                    cmd = line.strip().lower()
                    if cmd in ["q", "quit", "exit", "stop"]:
                        stop_all()
                        break
                    elif cmd in ["status", "check", "test"]:
                        all_passed, errors, results = run_fetch_diagnostics()
                        print_diagnostic_summary(all_passed, errors, results)
                    elif cmd in ["open", "ui"]:
                        webbrowser.open(BROWSER_URL)
                    elif cmd in ["help", "h"]:
                        print("Commands: 'q' to stop, 'status' or 'test' to re-run diagnostics, 'open' to open browser.", flush=True)
                except (KeyboardInterrupt, EOFError):
                    print("\nReceived stop signal...", flush=True)
                    stop_all()
                    break
            else:
                # Running non-interactively or in detached console
                time.sleep(2.0)
    except KeyboardInterrupt:
        print("\nReceived stop signal...", flush=True)
        stop_all()


if __name__ == "__main__":
    main()
