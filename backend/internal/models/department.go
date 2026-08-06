package models

type Department struct {
	DepartmentID   int     `json:"id"`
	DepartmentName string  `json:"department_name"`
	Description    *string `json:"description,omitempty"`
}
