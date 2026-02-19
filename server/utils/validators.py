from datetime import datetime
from typing import Dict, Any, List

def validate_date_range(check_in: str, check_out: str) -> bool:
    """Validate that check-in date is before check-out date."""
    try:
        check_in_date = datetime.strptime(check_in, '%Y-%m-%d')
        check_out_date = datetime.strptime(check_out, '%Y-%m-%d')
        
        if check_in_date >= check_out_date:
            return False
        
        # Check that dates are not in the past
        today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        if check_in_date < today:
            return False
        
        return True
    except ValueError:
        return False

def validate_request_body(data: Dict[str, Any], required_fields: List[str]) -> None:
    """Validate that all required fields are present in the request body."""
    if not isinstance(data, dict):
        raise ValueError("Request body must be a JSON object")
    
    missing_fields = []
    for field in required_fields:
        if field not in data or data[field] is None:
            missing_fields.append(field)
    
    if missing_fields:
        raise ValueError(f"Missing required fields: {', '.join(missing_fields)}")
    
    # Validate nested fields for dateRange
    if 'dateRange' in required_fields and 'dateRange' in data:
        if not isinstance(data['dateRange'], dict):
            raise ValueError("dateRange must be an object")
        if 'checkIn' not in data['dateRange'] or 'checkOut' not in data['dateRange']:
            raise ValueError("dateRange must contain checkIn and checkOut fields")

def validate_api_key_format(api_key: str) -> bool:
    """Basic validation for API key format."""
    if not api_key or not isinstance(api_key, str):
        return False
    if len(api_key) < 10:  # Minimum reasonable length
        return False
    return True

