import glob
import os

nav_template = """    <!-- Bottom Navigation Bar (Mobile Only) -->
    <nav class="md:hidden fixed bottom-0 w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 flex justify-around items-center h-16 z-40 pb-safe shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]">
        <a href="index.html" class="flex flex-col items-center justify-center w-full h-full {index_color} transition-colors">
            <i class="fas fa-home text-xl mb-1"></i>
            <span class="text-[10px] font-medium">ראשי</span>
        </a>
        <a href="orders-list.html" class="flex flex-col items-center justify-center w-full h-full {orders_color} transition-colors">
            <i class="fas fa-list-ul text-xl mb-1"></i>
            <span class="text-[10px] font-medium">הזמנות</span>
        </a>
        <!-- FAB Center Button -->
        <div class="relative w-full h-full flex justify-center">
            <a href="new-order.html" class="absolute -top-6 bg-emerald-600 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg shadow-emerald-600/30 border-4 border-white dark:border-slate-900 z-50 hover:scale-105 transition-transform">
                <i class="fas fa-plus text-xl"></i>
            </a>
        </div>
        <a href="returns-list.html" class="flex flex-col items-center justify-center w-full h-full {returns_color} transition-colors">
            <i class="fas fa-exchange-alt text-xl mb-1"></i>
            <span class="text-[10px] font-medium">החזרות</span>
        </a>
        <a href="settings.html" class="flex flex-col items-center justify-center w-full h-full {settings_color} transition-colors">
            <i class="fas fa-cog text-xl mb-1"></i>
            <span class="text-[10px] font-medium">הגדרות</span>
        </a>
    </nav>"""

active_class = "text-emerald-600 dark:text-emerald-400"
inactive_class = "text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400"

modified_count = 0

for f in glob.glob("*.html"):
    if f == "index.html":
        # We already manually modified index.html, so skip it to avoid double-processing
        continue
        
    with open(f, "r", encoding="utf-8") as file:
        content = file.read()
    
    original_content = content
    
    # Body
    content = content.replace(
        '<body class="min-h-screen text-slate-800">',
        '<body class="min-h-screen text-slate-800 bg-slate-50 dark:bg-slate-900 dark:text-slate-100 transition-colors duration-200">'
    )
    
    # Main
    content = content.replace(
        '<main class="flex-grow p-6 md:p-10">',
        '<main class="flex-grow p-4 md:p-10 pb-24 md:pb-10">'
    )
    
    # Inject Nav if not there
    if "Bottom Navigation Bar" not in content:
        filename = os.path.basename(f)
        
        index_col = active_class if filename == "index.html" else inactive_class
        orders_col = active_class if filename == "orders-list.html" else inactive_class
        returns_col = active_class if filename == "returns-list.html" else inactive_class
        settings_col = active_class if filename == "settings.html" else inactive_class
        
        nav_html = nav_template.format(
            index_color=index_col,
            orders_color=orders_col,
            returns_color=returns_col,
            settings_color=settings_col
        )
        
        content = content.replace('<!-- Shared Utilities -->', nav_html + '\n\n    <!-- Shared Utilities -->')
        
    if content != original_content:
        with open(f, "w", encoding="utf-8") as file:
            file.write(content)
        modified_count += 1
        print(f"Modified {f}")

print(f"Done. Modified {modified_count} files.")
