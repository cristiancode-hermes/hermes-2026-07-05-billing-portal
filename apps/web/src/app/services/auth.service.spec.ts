import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { User } from '../models/user.model';

const apiUrl = '/api';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.removeItem('billing_token');
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should not be authenticated initially', () => {
    expect(service.isAuthenticated()).toBe(false);
    expect(service.user()).toBeNull();
  });

  it('should login and store token', () => {
    const mockResponse = {
      token: 'test-token-123',
      user: { id: '1', email: 'test@test.com', name: 'Test', role: 'admin', organizationId: 'org-1' } as User,
    };

    service.login('test@test.com', 'password123').subscribe((res) => {
      expect(res.token).toBe('test-token-123');
      expect(res.user.email).toBe('test@test.com');
    });

    const req = httpMock.expectOne(`${apiUrl}/auth/login`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'test@test.com', password: 'password123' });
    req.flush(mockResponse);

    expect(localStorage.getItem('billing_token')).toBe('test-token-123');
    expect(service.user()?.email).toBe('test@test.com');
  });

  it('should register and store token', () => {
    const mockResponse = {
      token: 'reg-token-456',
      user: { id: '2', email: 'new@test.com', name: 'New', role: 'admin', organizationId: 'org-2' } as User,
    };

    service.register('My Org', 'new@test.com', 'secure123').subscribe((res) => {
      expect(res.token).toBe('reg-token-456');
    });

    const req = httpMock.expectOne(`${apiUrl}/auth/register`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ orgName: 'My Org', email: 'new@test.com', password: 'secure123' });
    req.flush(mockResponse);

    expect(localStorage.getItem('billing_token')).toBe('reg-token-456');
  });

  it('should logout and clear state', () => {
    localStorage.setItem('billing_token', 'test-token');
    service.logout();

    expect(localStorage.getItem('billing_token')).toBeNull();
    expect(service.user()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
  });

  it('should fetch current user via GET /auth/me', () => {
    const mockUser = { id: '1', email: 'test@test.com', name: 'Test', role: 'admin', organizationId: 'org-1', organizationName: 'Acme' };

    service.me().subscribe((user) => {
      expect(user.email).toBe('test@test.com');
    });

    const req = httpMock.expectOne(`${apiUrl}/auth/me`);
    expect(req.request.method).toBe('GET');
    req.flush(mockUser);
  });
});
