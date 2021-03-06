package com.stg.vms;

import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.support.v4.content.ContextCompat;
import android.support.v7.app.AppCompatActivity;
import android.os.Bundle;
import android.text.TextUtils;
import android.util.Log;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ImageButton;
import android.widget.ImageView;
import android.widget.TextView;
import android.widget.Toast;

import com.google.gson.Gson;
import com.squareup.picasso.Picasso;
import com.stg.vms.data.AppConstants;
import com.stg.vms.data.AppMessages;
import com.stg.vms.data.VMSData;
import com.stg.vms.model.LocationAccessRequest;
import com.stg.vms.model.LocationAccessResponse;
import com.stg.vms.model.SearchByPhotoRequest;
import com.stg.vms.model.SearchByPhotoResponse;
import com.stg.vms.model.ServiceResponse;
import com.stg.vms.service.VMSService;
import com.stg.vms.util.ImageUtil;
import com.stg.vms.util.VMSDialog;
import com.stg.vms.util.VMSUtil;

import retrofit2.converter.gson.GsonConverterFactory;

public class SecurityStaffDashboard extends AppCompatActivity {
    private static final String TAG = "SecurityStaffDashboard";
    private static final int REQUEST_SCAN_QR_CODE = 1, REQUEST_CAMERA_PHOTO = 2;
    private EditText visitorId;
    private View loader, msgContainer, profContainer;
    private TextView userMessage, name, visitorType, access;
    private ImageView visitorImage;
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_security_staff_dashboard);
        ImageView btnSearchByPhoto = findViewById(R.id.stf_btn_searchByPhoto);
        ImageButton barcodeButton = findViewById(R.id.stf_btn_barcode);
        visitorId = findViewById(R.id.stf_input_visitorId);
        ImageButton btnVisitorId = findViewById(R.id.stf_btn_visitorId);
        Button logout = findViewById(R.id.stf_btn_logout);
        loader = findViewById(R.id.stf_loader);
        msgContainer = findViewById(R.id.stf_container_msg);
        userMessage = findViewById(R.id.stf_lbl_msg);
        loader.setVisibility(View.GONE);
        msgContainer.setVisibility(View.GONE);
        profContainer = findViewById(R.id.stf_prof_container);
        name = findViewById(R.id.stf_visitorName);
        visitorType = findViewById(R.id.stf_visitorType);
        access = findViewById(R.id.stf_access);
        visitorImage = findViewById(R.id.stf_visitorImg);

        profContainer.setVisibility(View.GONE);
        btnVisitorId.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                if (!TextUtils.isEmpty(visitorId.getText())) {
                    retrieveVisitorProfile(visitorId.getText().toString(), 0);
                }
            }
        });

        barcodeButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                startActivityForResult(new Intent(SecurityStaffDashboard.this, BarcodeScanner.class), REQUEST_SCAN_QR_CODE);
            }
        });

        btnSearchByPhoto.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                startActivityForResult(new Intent(SecurityStaffDashboard.this, CameraPhoto.class), REQUEST_CAMERA_PHOTO);
            }
        });
        logout.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                VMSData.getInstance().setUserProfile(null);
                VMSData.getInstance().setAccessToken(null);
                startActivity(new Intent(SecurityStaffDashboard.this, LoginActivity.class));
                finish();
            }
        });
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        if (requestCode == REQUEST_SCAN_QR_CODE) {
            if (resultCode == RESULT_OK) {
                String visitorId = data.getStringExtra(BarcodeScanner.BAR_CODE_DATA);
                retrieveVisitorProfile(visitorId, 1);
            } else {
                Toast.makeText(this, AppMessages.BARCODE_SCAN_ERROR, Toast.LENGTH_LONG).show();
            }
        } else if (requestCode == REQUEST_CAMERA_PHOTO) {
            if (resultCode == RESULT_OK) {
                final String currentPhotoPath = data.getStringExtra(CameraPhoto.PHOTO_PATH);
                if (TextUtils.isEmpty(currentPhotoPath)) {
                    Toast.makeText(this, AppMessages.PHOTO_SAVE_ERROR, Toast.LENGTH_LONG).show();
                    return;
                }
                loader.setVisibility(View.VISIBLE);
                Thread thread = new Thread(new Runnable() {
                    @Override
                    public void run() {
                        final Bitmap imageBitmap = ImageUtil.processPhoto(currentPhotoPath);
                        VMSService.searchByPhoto(new SearchByPhotoRequest(ImageUtil.bitmap2Base64(imageBitmap)), new VMSService.Callback<SearchByPhotoResponse>() {
                            @Override
                            public void onSuccess(SearchByPhotoResponse data) {
                                loader.setVisibility(View.GONE);
                                if (data == null || data.getVisitorId() < 1) {
                                    VMSDialog.showErrorDialog(SecurityStaffDashboard.this, "Error", AppMessages.SEARCH_BY_FACE_ERROR, false);
                                    return;
                                }
                                retrieveVisitorProfile(String.valueOf(data.getVisitorId()), 0);
                            }

                            @Override
                            public void onError(String errorMsg) {
                                VMSDialog.showErrorDialog(SecurityStaffDashboard.this, "Error", errorMsg, false);
                                loader.setVisibility(View.GONE);
                            }

                            @Override
                            public void onLoginError(String errorMsg) {
                                Toast.makeText(SecurityStaffDashboard.this, AppMessages.SERVICE_CALL_AUTH_ERROR, Toast.LENGTH_LONG).show();
                                startActivity(new Intent(SecurityStaffDashboard.this, LoginActivity.class));
                                finish();
                            }
                        });
                    }
                });
                thread.start();
            } else {
                Toast.makeText(this, AppMessages.PHOTO_SAVE_ERROR, Toast.LENGTH_LONG).show();
            }
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        msgContainer.setVisibility(View.GONE);
    }

    private void retrieveVisitorProfile(String visitorId, int encrypted) {
        profContainer.setVisibility(View.GONE);
        loader.setVisibility(View.VISIBLE);
        VMSUtil.hideKeyboard(this);
        VMSService.locationAccess(new LocationAccessRequest(visitorId, VMSData.getInstance().getUserProfile().getUserId(), encrypted), new VMSService.Callback<LocationAccessResponse>() {
            @Override
            public void onSuccess(LocationAccessResponse data) {
                Log.i(this.getClass().getSimpleName(), "Location Access Resp: "+ new Gson().toJson(data));
                String text = "";
                if (data.isAllowed()) {
                    userMessage.setTextColor(ContextCompat.getColor(SecurityStaffDashboard.this, R.color.colorSuccess));
                    text = VMSUtil.extractFirstName(data.getName())+" has access to "+data.getCurrentLocation()+" !";
                } else {
                    userMessage.setTextColor(ContextCompat.getColor(SecurityStaffDashboard.this, R.color.colorError));
                    text = VMSUtil.extractFirstName(data.getName())+" doesn't have access to "+data.getCurrentLocation()+" !";
                }
                userMessage.setText(text);
                msgContainer.setVisibility(View.VISIBLE);

                Picasso.get().load(data.getPhoto()).placeholder(R.drawable.ic_person).into(visitorImage);
                name.setText(data.getName());
                visitorType.setText(data.getVisitorType());
                String visitorAccess = TextUtils.join("\n", data.getAllowedLocations());
                access.setText(visitorAccess);
                profContainer.setVisibility(View.VISIBLE);
                loader.setVisibility(View.GONE);
            }

            @Override
            public void onError(String errorMsg) {
                userMessage.setTextColor(Color.RED);
                userMessage.setText(errorMsg);
                msgContainer.setVisibility(View.VISIBLE);
                loader.setVisibility(View.GONE);
            }

            @Override
            public void onLoginError(String errorMsg) {
                Toast.makeText(SecurityStaffDashboard.this, AppMessages.SERVICE_CALL_AUTH_ERROR, Toast.LENGTH_LONG).show();
                startActivity(new Intent(SecurityStaffDashboard.this, LoginActivity.class));
                finish();
            }
        });
    }
}
