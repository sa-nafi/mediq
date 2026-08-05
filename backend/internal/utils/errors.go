package utils

import "errors"

// Common sentinel errors
var (
	ErrDuplicateEmail = errors.New("email already exists")
)
