function getSettings() {
    try {
        return JSON.parse(localStorage.getItem('veg-settings') || '{}');
    } catch(e) {
        return {};
    }
}

function saveSetting(key, value) {
    const s = getSettings();
    s[key] = value;
    localStorage.setItem('veg-settings', JSON.stringify(s));
}
