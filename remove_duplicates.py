#!/usr/bin/env python3
"""Remove duplicate code blocks causing syntax errors"""

def remove_duplicates():
    with open('simple_backend.py', 'r') as f:
        content = f.read()
    
    # Find all occurrences of the email_verified addition
    import re
    
    # Pattern for the duplicate try block
    duplicate_pattern = r'\n    # Add email_verified column if it doesn\'t exist\n    try:[\s\S]*?except:\n        pass  # Column might already exist'
    
    # Find all matches
    matches = list(re.finditer(duplicate_pattern, content))
    
    # If there are multiple matches, keep only those that are properly indented (inside functions)
    if len(matches) > 1:
        # Remove duplicates that are not properly indented
        for match in reversed(matches):
            # Check if this is inside a function by looking at indentation
            start_pos = match.start()
            # Look back to find the indentation level
            line_start = content.rfind('\n', 0, start_pos) + 1
            indent_level = len(content[line_start:start_pos]) - len(content[line_start:start_pos].lstrip())
            
            # If indent level is 4 (not inside a function), remove it
            if indent_level == 4:
                content = content[:match.start()] + content[match.end():]
    
    # Write the cleaned file
    with open('simple_backend.py', 'w') as f:
        f.write(content)
    
    print("✅ Removed duplicate code blocks")

if __name__ == "__main__":
    remove_duplicates()