import os
import re

directories = [
    r"C:\Users\CHRIST\Desktop\ANTIGRAVITY\projets\ecocycle-ci\frontend\src\new_components",
    r"C:\Users\CHRIST\Desktop\ANTIGRAVITY\projets\ecocycle-ci\frontend\src\features",
    r"C:\Users\CHRIST\Desktop\ANTIGRAVITY\projets\ecocycle-ci\frontend\src\contexts"
]

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content
    needs_use_client = False
    
    # Check if it looks like a React component
    if "from 'react'" in content or "from \"react\"" in content or "export function" in content or "export const" in content:
        if "use client" not in content and ".tsx" in filepath:
            needs_use_client = True

    # React Router to Next.js replacements
    if "react-router-dom" in content:
        # Link replacement
        content = re.sub(r"import\s*\{\s*Link[^}]*\}\s*from\s*['\"]react-router-dom['\"];?", "import Link from 'next/link';", content)
        
        # useNavigate to useRouter
        if "useNavigate" in content:
            content = re.sub(r"import\s*\{\s*[^}]*useNavigate[^}]*\}\s*from\s*['\"]react-router-dom['\"];?", "import { useRouter } from 'next/navigation';", content)
            content = content.replace("useNavigate()", "useRouter()")
            
        # Clean up leftover react-router-dom imports if they are empty
        content = re.sub(r"import\s*\{\s*\}\s*from\s*['\"]react-router-dom['\"];?", "", content)
        # Or if there are other things like Navigate, let's just do a blanket warning or replace Navigate with redirect
        
        # Also ensure use client if we use hooks
        needs_use_client = True

    # Other hooks check
    if "useState" in content or "useEffect" in content or "useContext" in content:
        needs_use_client = True

    if needs_use_client and not content.startswith('"use client"'):
        content = '"use client";\n\n' + content

    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated: {filepath}")

for directory in directories:
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith('.ts') or file.endswith('.tsx'):
                process_file(os.path.join(root, file))

print("Migration script completed.")
