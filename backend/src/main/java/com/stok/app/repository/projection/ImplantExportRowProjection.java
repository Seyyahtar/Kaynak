package com.stok.app.repository.projection;

import java.time.LocalDate;

public interface ImplantExportRowProjection {
    LocalDate getCaseDate();

    String getHospitalName();

    String getDoctorName();

    String getPatientName();

    String getMaterialName();

    Integer getQuantity();

    String getSerialLotNumber();

    String getProductCode();
}
