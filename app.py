#!/usr/bin/env python3
"""
NASA FIRMS Forest Fire Early Detection System (FAMS)
IEEE Environmental Monitoring Project — Multi-Biome Surveillance

Interactive Console & Controller:
Delegates to run.py for server lifecycle management and data fetch validation.
"""

import os
import sys
import webbrowser
from typing import List

# Import unified controller functions from run.py
import run

Colors = run.Colors
FRONTEND_URL = run.BROWSER_URL


def interactive_menu():
    """Display interactive CLI menu when run without arguments."""
    while True:
        print(f"\n======================================================================")
        print(f"  {Colors.BOLD}NASA FIRMS FOREST FIRE EARLY DETECTION SYSTEM{Colors.RESET}")
        print(f"  IEEE Environmental Monitoring — Interactive Control Console")
        print(f"======================================================================")
        print(f"  1. Start Application (Backend + Frontend + Validate Fetch + Open Browser)")
        print(f"  2. Stop Application (Release all ports & processes)")
        print(f"  3. Restart Application")
        print(f"  4. Status & Fetch Diagnostics (Verify 0 'Failed to Fetch' Errors)")
        print(f"  5. Open Web Map in Browser")
        print(f"  0. Exit")
        print(f"======================================================================")

        try:
            choice = input(f"Enter option [{Colors.CYAN}0-5{Colors.RESET}]: ").strip()
        except (KeyboardInterrupt, EOFError):
            print("\nExiting.")
            break

        if choice == "1":
            run.start_all(open_browser=True)
        elif choice == "2":
            run.stop_all()
        elif choice == "3":
            run.stop_all()
            run.time.sleep(1.0)
            run.start_all(open_browser=True)
        elif choice == "4":
            all_passed, errors, results = run.run_fetch_diagnostics()
            run.print_diagnostic_summary(all_passed, errors, results)
        elif choice == "5":
            if run.is_port_listening(run.FRONTEND_PORT):
                print(f"\nOpening {FRONTEND_URL} in your default browser...")
                webbrowser.open(FRONTEND_URL)
            else:
                print(f"\n{Colors.YELLOW}[!] Application is not running. Start it first with option 1.{Colors.RESET}")
        elif choice in ["0", "exit", "quit", "q"]:
            print("Goodbye.")
            break
        else:
            print(f"{Colors.YELLOW}Invalid selection. Please choose 0 to 5.{Colors.RESET}")


def main():
    args = [a.lower() for a in sys.argv[1:]]

    if not args:
        interactive_menu()
        return

    cmd = args[0]
    no_browser = "--no-browser" in args or "-n" in args

    if cmd in ["start", "up", "run"]:
        run.start_all(open_browser=not no_browser)
    elif cmd in ["stop", "down", "kill"]:
        run.stop_all()
    elif cmd in ["restart", "reload"]:
        run.stop_all()
        run.time.sleep(1.0)
        run.start_all(open_browser=not no_browser)
    elif cmd in ["status", "check", "test", "ps"]:
        all_passed, errors, results = run.run_fetch_diagnostics()
        run.print_diagnostic_summary(all_passed, errors, results)
    elif cmd in ["open", "browser", "ui"]:
        if run.is_port_listening(run.FRONTEND_PORT):
            print(f"\nOpening {FRONTEND_URL} in your default browser...")
            webbrowser.open(FRONTEND_URL)
        else:
            print(f"\n{Colors.YELLOW}[!] Application is not running. Start it first with: python run.py{Colors.RESET}")
    elif cmd in ["help", "-h", "--help"]:
        print("""
Usage: python app.py [command] [options]   (or: python run.py)

Commands:
  start     Start both backend (port 8000) and frontend (port 5173), test fetch & open browser
  stop      Gracefully terminate all running backend and frontend processes
  restart   Stop and restart the full application with fresh memory cache
  status    Display health status and run live fetch diagnostics
  open      Open the web application in your default browser

Options:
  --no-browser, -n   Start application without opening the web browser automatically

Interactive Mode:
  Run 'python app.py' with no arguments for the interactive menu.
""")
    else:
        print(f"Unknown command: '{cmd}'. Run 'python app.py help' for usage.")
        sys.exit(1)


if __name__ == "__main__":
    main()
