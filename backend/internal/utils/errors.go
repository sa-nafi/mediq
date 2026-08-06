package utils

import "errors"

// Common sentinel errors
var (
	ErrDuplicateEmail   = errors.New("email already exists")
	ErrConflict         = errors.New("resource already exists or conflicts")
	ErrInUse            = errors.New("resource is currently in use and cannot be deleted")
	ErrNotFound         = errors.New("resource not found")
	ErrInvalidReference = errors.New("invalid reference to another resource")
)
