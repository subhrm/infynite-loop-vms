package com.stg.vms.service;

import javax.servlet.http.HttpServletRequest;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;

import com.stg.vms.exception.VMSException;
import com.stg.vms.model.ApproveVisitorRequest;
import com.stg.vms.model.LocationAccessRequest;
import com.stg.vms.model.LocationAccessResponse;
import com.stg.vms.model.UpdateStatusRequest;
import com.stg.vms.repository.VMSRepository;
import com.stg.vms.util.WebUtils;

@Service
public class VMSAppService {
	@Autowired
	private VMSRepository vmsRepository;
	@Autowired
	TextCryptService textCryptService;
	@Autowired
	Environment env;

	public void approveVisitor(ApproveVisitorRequest request) throws VMSException {
		vmsRepository.approveVisitorBySecurity(request);
	}

	public void updateStatus(UpdateStatusRequest request) throws VMSException {
		vmsRepository.updateStatus(request.getVisitorId(), request.getSecurityId(), request.getStatus());
	}

	public LocationAccessResponse visitorLocations(LocationAccessRequest request, HttpServletRequest req)
			throws VMSException {
		long visitorId = 0;
		if (request.getEncrypted() == 1)
			visitorId = Long.valueOf(textCryptService.decryptText(request.getVisitorId()));
		else
			visitorId = Long.valueOf(request.getVisitorId());
		LocationAccessResponse resp = vmsRepository.visitorLocations(visitorId,
				vmsRepository.getSecurityLocationId(request.getSecurityId()), WebUtils.getBaseUrl(req)+"/images/");
		if (resp.isAllowed())
			vmsRepository.addVisitorLog(visitorId, request.getSecurityId(),
					env.getProperty("eventtype.entry", Long.class));
		return resp;
	}
}
