package models

type Medicine struct {
	MedicineID   int     `json:"id"`
	MedicineName string  `json:"medicine_name"`
	Category     *string `json:"category,omitempty"`
	InfoLink     *string `json:"info_link,omitempty"`
}
