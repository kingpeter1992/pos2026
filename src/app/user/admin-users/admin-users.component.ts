import { Component, OnInit } from '@angular/core';
import { Route, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { LoaderService } from '../../shares/services/loader/loader-service';
import { Toast } from '../../shares/services/toast/toast';
import { AuthService } from '../../auth/services/auth/auth-service';

@Component({
  selector: 'app-admin-users',
  templateUrl: './admin-users.component.html',
  styleUrl: './admin-users.component.scss',
  standalone:false
})
export class AdminUsersComponent implements OnInit {
  rolesList = ['ROLE_USER', 'ROLE_ADMIN', 'ROLE_CAISSIER', 'ROLE_RESPONSABLE_PERSONNEL'];
  loading$: Observable<boolean> | undefined;
  users: any[] = [];
  selectedRoles: string[] = [];
  dRoles: string[] = [];

loadingRow: Record<number, boolean> = {};
savingRolesRow: Record<number, boolean> = {};

    constructor(
    private loadingService: LoaderService,
    private toastrService: Toast,
    private _dao: AuthService,
    private route: Router
  ) {
    this.loading$ = this.loadingService.loading$;
  }


// Add this method to check if a user has a specific role
hasRole(user: any, role: string): boolean {
  return user.selectedRoles?.includes(role);
}


  ngOnInit(): void {
        this.loadUsers();
  }

loadUsers() {
  this._dao.getAllUsers().subscribe({
    next: (data) => {
      this.users = (data || []).map((u: any) => ({
        ...u,
        // ✅ roles viennent déjà comme string[]
        selectedRoles: [...(u.roles || [])],
        originalRoles: [...(u.roles || [])],
        active: u.active ?? true,
      }));
              console.log(this.users)

    },
    error: () => this.toastrService.error('Erreur chargement utilisateurs')
  });
}
isRolesDirty(user: any): boolean {
  const a = (user.selectedRoles || []).slice().sort().join('|');
  const b = (user.originalRoles || []).slice().sort().join('|');
  return a !== b;
}


toggleBlock(user: any) {
  this.loadingRow[user.id] = true;

  // ✅ Optimistic UI
  const previous = user.active;
  user.active = !user.active;

  const req$ = previous ? this._dao.blockUser(user.id) : this._dao.unblockUser(user.id);

  req$.subscribe({
    next: () => {
      this.toastrService.success(
        previous ? `Utilisateur bloqué : ${user.username}` : `Utilisateur débloqué : ${user.username}`
      );
      // Option: recharger si tu veux data fraîche
      this.loadUsers();
    },
    error: () => {
      // rollback
      user.active = previous;
      this.toastrService.error("Impossible de modifier le statut");
    },
    complete: () => (this.loadingRow[user.id] = false),
  });
}

onRoleChange(user: any, role: string, checked: boolean) {
  if (!user.selectedRoles) user.selectedRoles = [];

  if (checked && !user.selectedRoles.includes(role)) {
    user.selectedRoles.push(role);
  }
  if (!checked) {
    user.selectedRoles = user.selectedRoles.filter((r: string) => r !== role);
  }
}

  assignRolesToUser(userId: number, selectedRoles: string[]) {
    this._dao.assignRoles(userId, selectedRoles).subscribe({
      next: (res) => alert('Rôles attribués avec succès !'),
      error: (err) => alert('Erreur : ' + err.message),
    });
  }


saveRoles(user: any) {
  if (!this.isRolesDirty(user)) {
    this.toastrService.info("Aucun changement à enregistrer");
    return;
  }

  this.savingRolesRow[user.id] = true;

  this._dao.assignRoles(user.id, user.selectedRoles).subscribe({
    next: () => {
      user.originalRoles = [...user.selectedRoles]; // ✅ reset dirty
      this.toastrService.success(`Rôles mis à jour pour ${user.username}`);
      this.loadUsers();
    },
    error: () => this.toastrService.error("Erreur lors de l'attribution des rôles"),
    complete: () => (this.savingRolesRow[user.id] = false),
  });
}
}
