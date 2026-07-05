import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { PlanService } from './plan.service';

const apiUrl = '/api';

describe('PlanService', () => {
  let service: PlanService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [PlanService],
    });
    service = TestBed.inject(PlanService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should fetch all plans via GET', () => {
    const mockPlans = [
      { id: '1', name: 'Basic', price: 29, cycle: 'monthly', isActive: true },
      { id: '2', name: 'Pro', price: 99, cycle: 'monthly', isActive: true },
    ];

    service.getAll().subscribe((plans) => {
      expect(plans).toEqual(mockPlans);
      expect(plans.length).toBe(2);
    });

    const req = httpMock.expectOne(`${apiUrl}/plans`);
    expect(req.request.method).toBe('GET');
    req.flush(mockPlans);
  });

  it('should fetch a single plan by ID via GET', () => {
    const mockPlan = { id: '1', name: 'Basic', price: 29, cycle: 'monthly', isActive: true };

    service.getById('1').subscribe((plan) => {
      expect(plan).toEqual(mockPlan);
    });

    const req = httpMock.expectOne(`${apiUrl}/plans/1`);
    expect(req.request.method).toBe('GET');
    req.flush(mockPlan);
  });

  it('should create a plan via POST', () => {
    const planData = { name: 'New Plan', description: 'A new plan', price: 49, cycle: 'monthly' as const, features: [], isActive: true };
    const createdPlan = { id: '3', ...planData };

    service.create(planData).subscribe((plan) => {
      expect(plan).toEqual(createdPlan);
    });

    const req = httpMock.expectOne(`${apiUrl}/plans`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(planData);
    req.flush(createdPlan);
  });

  it('should update a plan via PUT', () => {
    const updateData = { price: 79 };

    service.update('1', updateData).subscribe((plan) => {
      expect(plan.price).toBe(79);
    });

    const req = httpMock.expectOne(`${apiUrl}/plans/1`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(updateData);
    req.flush({ id: '1', name: 'Basic', price: 79, cycle: 'monthly', isActive: true });
  });

  it('should delete a plan via DELETE', () => {
    service.delete('1').subscribe((res) => {
      expect(res).toBeNull();
    });

    const req = httpMock.expectOne(`${apiUrl}/plans/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
