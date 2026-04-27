
# Priority mapping
PRIORITY_MAP = {
    "camera blackout": 2,
    "intrusion": 1,
    "crowd": 3,
    "object missing": 2,
    "loitering detection": 3,
    "unauthorized tracking": 1,
    "staff presence": 3,
    "staff seat absence": 2,
    "unattended object": 3,
}

# Alerts to ignore
IGNORE_ALERTS = {
    "heatmap"
}

# Important alerts (always include)
IMPORTANT_ALERTS = {
    "camera blackout",
    "blackout",
    "intrusion",
    "unauthorized tracking",
    "crowd",
    "staff seat absence"
    #,"heatmap" #testing purpose
}