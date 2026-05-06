import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ResetGameConfirmDialogComponent, ResetGameConfirmDialogData } from './reset-game-confirm-dialog.component';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { GameLogExportService } from '../../../services/game-log-export';

describe('ResetGameConfirmDialogComponent', () => {
  let component: ResetGameConfirmDialogComponent;
  let fixture: ComponentFixture<ResetGameConfirmDialogComponent>;
  let mockDialogRef: any;
  let mockGameLogExportService: any;
  const mockData: ResetGameConfirmDialogData = { hasGameHistory: true };

  beforeEach(async () => {
    mockDialogRef = {
      close: vi.fn(),
    };
    mockGameLogExportService = {
      saveGameLog: vi.fn().mockResolvedValue(true),
    };

    await TestBed.configureTestingModule({
      imports: [ResetGameConfirmDialogComponent],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: mockData },
        { provide: GameLogExportService, useValue: mockGameLogExportService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ResetGameConfirmDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should close with "cancel" when cancel is called', () => {
    component.cancel();
    expect(mockDialogRef.close).toHaveBeenCalledWith('cancel');
  });

  it('should close with "reset" when reset is called', () => {
    component.reset();
    expect(mockDialogRef.close).toHaveBeenCalledWith('reset');
  });

  it('should call saveGameLog but NOT close dialog when save is called', async () => {
    await component.save();
    expect(mockGameLogExportService.saveGameLog).toHaveBeenCalled();
    expect(mockDialogRef.close).not.toHaveBeenCalled();
  });
});
