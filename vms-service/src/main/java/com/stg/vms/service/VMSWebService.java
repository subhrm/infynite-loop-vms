package com.stg.vms.service;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.Future;

import javax.servlet.http.HttpServletRequest;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.stereotype.Service;

import com.stg.vms.exception.VMSException;
import com.stg.vms.helper.EmailHelper;
import com.stg.vms.helper.PdfHelper;
import com.stg.vms.helper.TokenUtils;
import com.stg.vms.model.ApprovedVisitorsToday;
import com.stg.vms.model.Employee;
import com.stg.vms.model.EmployeeFamily;
import com.stg.vms.model.RegVisitorResponse;
import com.stg.vms.model.ServiceResponse;
import com.stg.vms.model.VisitorRegisterationRequest;
import com.stg.vms.model.VisitorRegistrationResponse;
import com.stg.vms.repository.VMSRepository;
import com.stg.vms.repository.VMSWebRepository;
import com.stg.vms.threads.RegisterVisitor;
import com.stg.vms.util.MessageUtils;
import com.stg.vms.util.WebUtils;

@Service
public class VMSWebService {
	private Logger log = LoggerFactory.getLogger(this.getClass());
	@Autowired
	VMSWebRepository vmsWebRepository;
	@Autowired
	VMSRepository vmsRepository;
	@Autowired
	TokenUtils tokenUtils;
	@Autowired
	TextCryptService textCryptService;
	@Autowired
	VMSService vmsService;
	@Autowired
	PdfHelper pdfHelper;
	@Autowired
	EmailHelper emailHelper;
	@Autowired
	Environment env;
	@Autowired
	MailContentService mailContentService;
	@Autowired
	ThreadPoolTaskExecutor taskExecutor;

	public List<EmployeeFamily> getEmployeeFamily(long empId) throws VMSException {
		try {
			return vmsWebRepository.getEmployeeFamily(empId);
		} catch (VMSException e) {
			throw e;
		} catch (Exception e) {
			log.error("Error in fetchVisitorProfile service: ", e);
			throw new VMSException(env.getProperty("errormsg.generic"));
		}
	}

	public ServiceResponse<List<VisitorRegistrationResponse>> registerVisitor(HttpServletRequest req,
			List<VisitorRegisterationRequest> regRequest, boolean spotRegistration) throws VMSException {
		try {
			ServiceResponse<List<VisitorRegistrationResponse>> result = new ServiceResponse<>();
			List<String> errorNames = new ArrayList<>();
			result.setData(new ArrayList<>());
			List<Future<RegVisitorResponse>> regResponse = new ArrayList<>();
			String baseUrl = WebUtils.getBaseUrl(req);
			regRequest.forEach(request -> {
				RegisterVisitor regVisitor = new RegisterVisitor(vmsWebRepository, vmsRepository, request, pdfHelper,
						emailHelper, env, mailContentService, vmsService, baseUrl, spotRegistration);
				regResponse.add(taskExecutor.submit(regVisitor));
			});
			regResponse.forEach(response -> {
				if (response != null) {
					try {
						if (response.get() != null) {
							RegVisitorResponse resp = response.get();
							VisitorRegistrationResponse vrr = new VisitorRegistrationResponse();
							result.getData().add(vrr);
							vrr.setData(resp.getProfile());
							if (resp.isError()) {
								vrr.setStatus(env.getProperty("status.visitor.registeration.error", Integer.class));
								vrr.setMessage(resp.getErrorMsg());
								errorNames.add(resp.getProfile().getName());
							} else {
								if (resp.isSentForVerification()) {
									vrr.setStatus(
											env.getProperty("status.visitor.registeration.pending", Integer.class));
									vrr.setMessage(env.getProperty("message.vistiorReg.pendingApproval"));
								} else {
									vrr.setStatus(
											env.getProperty("status.visitor.registeration.success", Integer.class));
									vrr.setMessage(env.getProperty("message.vistiorReg.gatePassSent"));
								}
							}
						}
					} catch (InterruptedException | ExecutionException e) {
						log.error("Error in visitor registration", e);
					}
				}
			});
			if (!errorNames.isEmpty()) {
				result.setStatus(env.getProperty("status.error", Integer.class));
				result.setMessage(env.getProperty("errormsg.visitor.register").replace("{}",
						MessageUtils.getCommaSaperatedString(errorNames)));
			} else {
				result.setStatus(env.getProperty("status.success", Integer.class));
			}
			return result;
		} catch (Exception e) {
			log.error("Error in registerVisitor service: ", e);
			throw new VMSException(env.getProperty("errormsg.generic"));
		}
	}

	public List<ApprovedVisitorsToday> approvedVisitorsToday() throws VMSException {
		try {
			return vmsWebRepository.approvedVisitorsToday();
		} catch (VMSException e) {
			throw e;
		} catch (Exception e) {
			log.error("Error in approvedVisitorsToday service: ", e);
			throw new VMSException(env.getProperty("errormsg.generic"));
		}
	}

	public Employee fetchEmployeeById(long empId) throws VMSException {
		try {
			return vmsWebRepository.fetchEmployeebyId(empId);
		} catch (VMSException e) {
			throw e;
		} catch (Exception e) {
			log.error("Error in fetchEmployeeById service: ", e);
			throw new VMSException(env.getProperty("errormsg.generic"));
		}
	}
}
