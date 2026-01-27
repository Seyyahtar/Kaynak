package com.stok.app.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

/**
 * DTO for creating/updating checklist records
 */
public class ChecklistRequest {

    @NotBlank(message = "Title is required")
    private String title;

    @NotEmpty(message = "At least one patient is required")
    private List<PatientRequest> patients;

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public List<PatientRequest> getPatients() {
        return patients;
    }

    public void setPatients(List<PatientRequest> patients) {
        this.patients = patients;
    }

    public static class PatientRequest {
        @NotBlank(message = "Patient name is required")
        private String name;

        private String note;
        private String phone;
        private String city;
        private String hospital;
        private String date;
        private String time;
        private Boolean checked = false;

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public String getNote() {
            return note;
        }

        public void setNote(String note) {
            this.note = note;
        }

        public String getPhone() {
            return phone;
        }

        public void setPhone(String phone) {
            this.phone = phone;
        }

        public String getCity() {
            return city;
        }

        public void setCity(String city) {
            this.city = city;
        }

        public String getHospital() {
            return hospital;
        }

        public void setHospital(String hospital) {
            this.hospital = hospital;
        }

        public String getDate() {
            return date;
        }

        public void setDate(String date) {
            this.date = date;
        }

        public String getTime() {
            return time;
        }

        public void setTime(String time) {
            this.time = time;
        }

        public Boolean getChecked() {
            return checked;
        }

        public void setChecked(Boolean checked) {
            this.checked = checked;
        }
    }
}
