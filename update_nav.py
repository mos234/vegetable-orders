import os
import re

nav_template = """    <!-- Mobile Bottom Navigation -->
    <nav class="mobile-bottom-nav-container md:hidden fixed bottom-0 left-0 right-0 z-50 bg-emerald-700 text-white shadow-2xl">
        <div class="flex">
            <a href="index.html" class="mobile-nav-item flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-xs font-medium {home_active}">
                <i class="fas fa-home text-xl"></i><span>בית</span>
            </a>
            <a href="catalog.html" class="mobile-nav-item flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-xs font-medium {catalog_active}">
                <i class="fas fa-tag text-xl"></i><span>קטלוג</span>
            </a>
            <a href="suppliers.html" class="mobile-nav-item flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-xs font-medium {suppliers_active}">
                <i class="fas fa-truck text-xl"></i><span>ספקים</span>
            </a>
            <a href="monthly-report.html" class="mobile-nav-item flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-xs font-medium {report_active}">
                <i class="fas fa-chart-line text-xl"></i><span>דוחות</span>
            </a>
            <a href="settings.html" class="mobile-nav-item flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-xs font-medium {settings_active}">
                <i class="fas fa-cog text-xl"></i><span>הגדרות</span>
            </a>
        </div>
    </nav>"""

nav_regex = re.compile(r'<!-- Mobile Bottom Navigation -->\s*<nav class="mobile-bottom-nav-container.*?</nav>', re.DOTALL)

for file in os.listdir('.'):
    if file.endswith('.html'):
        with open(file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        home_active = 'text-amber-300' if file == 'index.html' else 'text-white/80 hover:text-white'
        catalog_active = 'text-amber-300' if file == 'catalog.html' else 'text-white/80 hover:text-white'
        suppliers_active = 'text-amber-300' if file == 'suppliers.html' else 'text-white/80 hover:text-white'
        report_active = 'text-amber-300' if file == 'monthly-report.html' else 'text-white/80 hover:text-white'
        settings_active = 'text-amber-300' if file == 'settings.html' else 'text-white/80 hover:text-white'
        
        new_nav = nav_template.format(
            home_active=home_active,
            catalog_active=catalog_active,
            suppliers_active=suppliers_active,
            report_active=report_active,
            settings_active=settings_active
        )
        
        if nav_regex.search(content):
            new_content = nav_regex.sub(new_nav, content)
        else:
            # If not found, just insert before script tags or body end
            if '<!-- Shared Utilities -->' in content:
                new_content = content.replace('<!-- Shared Utilities -->', new_nav + '\n\n    <!-- Shared Utilities -->')
            elif '</body>' in content:
                new_content = content.replace('</body>', new_nav + '\n</body>')
            else:
                new_content = content + '\n' + new_nav
                
        with open(file, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {file}")
