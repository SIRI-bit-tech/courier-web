import re
from django.core.exceptions import ValidationError
from django.utils.translation import gettext as _

class CustomPasswordValidator:
    """
    Custom password validator with enhanced security requirements
    """
    
    def validate(self, password, user=None):
        """
        Validate that the password meets security requirements
        """
        errors = []
        
        # Minimum length
        if len(password) < 12:
            errors.append(_("Password must be at least 12 characters long."))
        
        # Maximum length (prevent DoS)
        if len(password) > 128:
            errors.append(_("Password must be no more than 128 characters long."))
        
        # Check for at least one uppercase letter
        if not re.search(r'[A-Z]', password):
            errors.append(_("Password must contain at least one uppercase letter."))
        
        # Check for at least one lowercase letter
        if not re.search(r'[a-z]', password):
            errors.append(_("Password must contain at least one lowercase letter."))
        
        # Check for at least one digit
        if not re.search(r'\d', password):
            errors.append(_("Password must contain at least one digit."))
        
        # Check for at least one special character
        if not re.search(r'[!@#$%^&*()_+\-=\[\]{};\':"\\|,.<>\/?]', password):
            errors.append(_("Password must contain at least one special character."))
        
        # Check for common patterns (dictionary words, sequences)
        common_patterns = [
            r'123456', r'password', r'qwerty', r'abc123', r'admin', r'user',
            r'123456789', r'password123', r'admin123', r'root', r'guest'
        ]
        
        password_lower = password.lower()
        for pattern in common_patterns:
            if pattern in password_lower:
                errors.append(_("Password contains common patterns that are easily guessed."))
                break
        
        # Check for repeated characters
        if re.search(r'(.)\1{3,}', password):
            errors.append(_("Password cannot contain more than 3 consecutive repeated characters."))
        
        # Check for keyboard sequences
        keyboard_sequences = [
            'qwertyuiop', 'asdfghjkl', 'zxcvbnm', '1234567890',
            'qwertzuiop', 'asdfghjkl', 'yxcvbnm'
        ]
        
        for sequence in keyboard_sequences:
            if sequence in password_lower or sequence[::-1] in password_lower:
                errors.append(_("Password cannot contain keyboard sequences."))
                break
        
        if errors:
            raise ValidationError(errors)
    
    def get_help_text(self):
        """
        Return help text for password requirements
        """
        return _(
            "Your password must contain at least 12 characters, including "
            "uppercase and lowercase letters, numbers, and special characters. "
            "Avoid common patterns, dictionary words, and keyboard sequences."
        )