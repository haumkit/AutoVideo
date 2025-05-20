import subprocess
import sys
import os
import time
import signal
import psutil
import shutil

def run_command(command, cwd=None):
    """Run a command and return its output"""
    try:
        process = subprocess.Popen(
            command,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            shell=True,
            cwd=cwd,
            text=True
        )
        return process
    except Exception as e:
        print(f"Error running command '{command}': {str(e)}")
        return None

def kill_process_on_port(port):
    """Kill any process running on the specified port"""
    try:
        subprocess.run(f"lsof -ti:{port} | xargs kill -9", shell=True)
    except:
        pass

def check_directory(path):
    """Check if directory exists"""
    if not os.path.exists(path):
        print(f"Error: Directory {path} does not exist")
        return False
    return True

def setup_environment():
    """Setup Python virtual environment and install dependencies"""
    print("Setting up environment...")
    
    # Remove old environment if exists
    if os.path.exists("env38"):
        print("Removing old environment...")
        shutil.rmtree("env38")
    
    # Create new environment
    subprocess.run("python3.8 -m venv env38", shell=True)
    
    # Activate environment and install dependencies
    commands = [
        "source env38/bin/activate",
        "pip install --upgrade pip",
        "pip install -r backend/requirements.txt",
        "pip install -r autovideo/requirements.txt"
    ]
    
    for cmd in commands:
        subprocess.run(cmd, shell=True, executable="/bin/bash")

def main():
    # Kill any existing processes on our ports
    kill_process_on_port(3000)  # Frontend
    kill_process_on_port(8000)  # Backend
    kill_process_on_port(9000)  # AV Server
    
    # Check directories
    if not all([
        check_directory("frontend"),
        check_directory("backend"),
        check_directory("autovideo")
    ]):
        return
    
    # Setup environment
    setup_environment()
    
    # Start frontend
    print("\nStarting frontend...")
    frontend_process = run_command("npm start", cwd="frontend")
    if not frontend_process:
        print("Failed to start frontend")
        return
    
    # Wait for frontend to start
    print("Waiting for frontend to start...")
    time.sleep(10)
    
    # Start backend
    print("\nStarting backend...")
    backend_process = run_command("source env38/bin/activate && python3 backend/be-server.py", cwd=".")
    if not backend_process:
        print("Failed to start backend")
        frontend_process.terminate()
        return
    
    # Wait for backend to start
    print("Waiting for backend to start...")
    time.sleep(10)
    
    # Start AV server
    print("\nStarting AV server...")
    av_process = run_command("source env38/bin/activate && python3 autovideo/av-server.py", cwd=".")
    if not av_process:
        print("Failed to start AV server")
        frontend_process.terminate()
        backend_process.terminate()
        return
    
    print("\nAll servers started successfully!")
    print("Frontend: http://localhost:3000")
    print("Backend: http://localhost:8000")
    print("AV Server: http://localhost:9000")
    
    try:
        # Monitor processes
        while True:
            if frontend_process.poll() is not None:
                print("Frontend stopped unexpectedly")
                break
            if backend_process.poll() is not None:
                print("Backend stopped unexpectedly")
                break
            if av_process.poll() is not None:
                print("AV server stopped unexpectedly")
                break
            
            # Print output from all processes
            for process, name in [(frontend_process, "Frontend"), 
                                (backend_process, "Backend"),
                                (av_process, "AV Server")]:
                output = process.stdout.readline()
                if output:
                    print(f"{name}: {output.strip()}")
            
            time.sleep(0.1)
            
    except KeyboardInterrupt:
        print("\nShutting down servers...")
    finally:
        # Cleanup
        for process in [frontend_process, backend_process, av_process]:
            if process:
                process.terminate()
                try:
                    process.wait(timeout=5)
                except subprocess.TimeoutExpired:
                    process.kill()

if __name__ == "__main__":
    main() 