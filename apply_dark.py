import glob
import os

replacements = {
    'class="bg-white ': 'class="bg-white dark:bg-slate-800 ',
    'class="bg-white"': 'class="bg-white dark:bg-slate-800"',
    'border-slate-100': 'border-slate-100 dark:border-slate-700',
    'border-slate-200': 'border-slate-200 dark:border-slate-700',
    'border-slate-300': 'border-slate-300 dark:border-slate-600',
    'bg-slate-50': 'bg-slate-50 dark:bg-slate-800/50',
    'bg-slate-100': 'bg-slate-100 dark:bg-slate-700',
    'bg-slate-200': 'bg-slate-200 dark:bg-slate-600',
    'text-slate-900': 'text-slate-900 dark:text-slate-100',
    'text-slate-800': 'text-slate-800 dark:text-slate-200',
    'text-slate-700': 'text-slate-700 dark:text-slate-300',
    'text-slate-600': 'text-slate-600 dark:text-slate-400',
    'text-slate-500': 'text-slate-500 dark:text-slate-400',
    'bg-emerald-50': 'bg-emerald-50 dark:bg-emerald-900/30',
    'bg-emerald-100': 'bg-emerald-100 dark:bg-emerald-900/50',
    'text-emerald-600': 'text-emerald-600 dark:text-emerald-400',
    'text-emerald-700': 'text-emerald-700 dark:text-emerald-400',
    'text-emerald-800': 'text-emerald-800 dark:text-emerald-300',
    'bg-amber-50': 'bg-amber-50 dark:bg-amber-900/30',
    'text-amber-700': 'text-amber-700 dark:text-amber-400',
    'text-amber-800': 'text-amber-800 dark:text-amber-300',
}

files_to_process = glob.glob("js/*.js") + glob.glob("*.html")

modified_count = 0

for f in files_to_process:
    with open(f, "r", encoding="utf-8") as file:
        content = file.read()
    
    original_content = content
    
    # Don't replace if it already has dark classes to avoid duplicates
    for old, new in replacements.items():
        if old in content:
            # Simple check to avoid double-dark if run multiple times
            # Note: This is rudimentary, but should work for a single pass
            content = content.replace(old, new)
            # Fix duplicate darks if any
            content = content.replace('dark:bg-slate-800 dark:bg-slate-800', 'dark:bg-slate-800')
            content = content.replace('dark:text-slate-100 dark:text-slate-100', 'dark:text-slate-100')
            content = content.replace('dark:text-slate-200 dark:text-slate-200', 'dark:text-slate-200')
            content = content.replace('dark:text-slate-300 dark:text-slate-300', 'dark:text-slate-300')
            content = content.replace('dark:text-slate-400 dark:text-slate-400', 'dark:text-slate-400')
            content = content.replace('dark:border-slate-700 dark:border-slate-700', 'dark:border-slate-700')
    
    if content != original_content:
        with open(f, "w", encoding="utf-8") as file:
            file.write(content)
        modified_count += 1
        print(f"Modified {f}")

print(f"Done. Modified {modified_count} files for Dark Mode compatibility.")
