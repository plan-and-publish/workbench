#!/usr/bin/env python3
"""
Pubspec Dependency Toggle Script

This script recursively finds 'pubspec.yaml' files and toggles a specific package 
dependency between 'git' and 'path' definitions. It is useful for switching between 
local development and remote versions.

Usage Examples:
---------------
1. Toggle to Local Path:
   python3 toggle_dependency.py --package platform_sdk --mode path --path ../platform-sdk/platform_sdk

2. Toggle to Git:
   python3 toggle_dependency.py --package platform_sdk --mode git --url git@github.com:plan-and-publish/platform-sdk --path platform_sdk --ref main

Arguments:
----------
--package (Required): 
    The name of the Dart package you want to toggle.
--mode (Required): 
    The target mode for the dependency. Options: 'path' or 'git'.
--path: 
    - If mode is 'path': The relative or absolute local file path to the package.
    - If mode is 'git': The internal path within the Git repository (optional).
--url: 
    The Git repository URL (required if mode is 'git').
--ref: 
    The Git reference (branch, tag, or commit hash) to use (required if mode is 'git', defaults to 'main').
--root: 
    The root directory to start searching for 'pubspec.yaml' files recursively (defaults to '.').

Dependency Sections:
--------------------
The script searches and updates the package in the following sections of 'pubspec.yaml':
- dependencies
- dev_dependencies
- dependency_overrides
"""
import os
import argparse
from ruamel.yaml import YAML

def toggle_dependency(pubspec_path, package_name, mode, path=None, url=None, ref=None, git_path=None):
    yaml = YAML()
    yaml.preserve_quotes = True
    yaml.indent(mapping=2, sequence=4, offset=2)
    
    with open(pubspec_path, 'r') as f:
        data = yaml.load(f)
    
    sections = ['dependencies', 'dev_dependencies', 'dependency_overrides']
    changed = False
    
    for section in sections:
        if section in data and package_name in data[section]:
            current = data[section][package_name]
            
            if mode == 'path':
                # Toggle to path
                if isinstance(current, dict) and 'git' in current:
                    data[section][package_name] = {'path': path}
                    changed = True
                    print(f"Updated {package_name} in {pubspec_path} ({section}) to path: {path}")
                elif isinstance(current, str) or (isinstance(current, dict) and 'path' in current):
                    # Already a path or version string, but user wants to ensure it's the specific path
                    data[section][package_name] = {'path': path}
                    changed = True
                    print(f"Ensured {package_name} in {pubspec_path} ({section}) is path: {path}")
            
            elif mode == 'git':
                # Toggle to git
                git_config = {'url': url}
                if ref:
                    git_config['ref'] = ref
                if git_path:
                    git_config['path'] = git_path
                
                if isinstance(current, dict) and 'path' in current:
                    data[section][package_name] = {'git': git_config}
                    changed = True
                    print(f"Updated {package_name} in {pubspec_path} ({section}) to git: {url}")
                elif isinstance(current, str) or (isinstance(current, dict) and 'git' in current):
                    # Already git or version string, but user wants to ensure it's the specific git config
                    data[section][package_name] = {'git': git_config}
                    changed = True
                    print(f"Ensured {package_name} in {pubspec_path} ({section}) is git: {url}")

    if changed:
        with open(pubspec_path, 'w') as f:
            yaml.dump(data, f)
    return changed

def main():
    parser = argparse.ArgumentParser(description='Toggle pubspec dependencies between path and git.')
    parser.add_argument('--package', required=True, help='Name of the package to toggle')
    parser.add_argument('--mode', required=True, choices=['path', 'git'], help='Target mode (path or git)')
    parser.add_argument('--path', help='Local path (if mode is path) or internal Git path (if mode is git)')
    parser.add_argument('--url', help='Git URL (required for mode git)')
    parser.add_argument('--ref', default='main', help='Git ref (default: main)')
    parser.add_argument('--root', default='.', help='Root directory to search recursively (default: .)')

    args = parser.parse_args()

    if args.mode == 'path' and not args.path:
        parser.error("--path is required when --mode is path")
    if args.mode == 'git' and not args.url:
        parser.error("--url is required when --mode is git")

    count = 0
    for root, dirs, files in os.walk(args.root):
        if 'pubspec.yaml' in files:
            pubspec_path = os.path.join(root, 'pubspec.yaml')
            if toggle_dependency(pubspec_path, args.package, args.mode, 
                                 path=args.path if args.mode == 'path' else None,
                                 url=args.url, 
                                 ref=args.ref, 
                                 git_path=args.path if args.mode == 'git' else None):
                count += 1
    
    print(f"Finished. Updated {count} pubspec.yaml files.")

if __name__ == '__main__':
    main()
