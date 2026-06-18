import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { ApiService } from '../../../services/api';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class Register {
  step = 1; // 1 = odabir role, 2 = forma

  role: 'athlete' | 'employee' = 'athlete';

  form = {
    username: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    favoriteSports: [] as string[],
    // employee only
    facilityName: '',
    facilityAddress: '',
    registrationNumber: '',
    pib: ''
  };

  sports = [
    { _id: '', name: '' }
  ];

  profileImageFile: File | null = null;
  profileImagePreview: string | null = null;
  useAvatar = false;
  avatarUrl = '';

  errors: any = {};
  serverError = '';
  successMessage = '';
  loading = false;

  pwRegex = /^(?=[A-Za-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,12}$/;

  constructor(private api: ApiService, private router: Router) {
    this.api.getSports().subscribe(data => this.sports = data);
  }

  selectRole(r: 'athlete' | 'employee') {
    this.role = r;
    this.step = 2;
  }

  toggleSport(id: string) {
    const idx = this.form.favoriteSports.indexOf(id);
    if (idx === -1) {
      if (this.form.favoriteSports.length < 5) this.form.favoriteSports.push(id);
    } else {
      this.form.favoriteSports.splice(idx, 1);
    }
  }

  isSportSelected(id: string): boolean {
    return this.form.favoriteSports.includes(id);
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;
    this.profileImageFile = file;
    this.useAvatar = false;
    const reader = new FileReader();
    reader.onload = (e: any) => this.profileImagePreview = e.target.result;
    reader.readAsDataURL(file);
  }

  generateAvatar() {
    const seed = this.form.username || Math.random().toString(36).substring(7);
    this.avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
    this.useAvatar = true;
    this.profileImageFile = null;
    this.profileImagePreview = this.avatarUrl;
  }

  async saveAvatarAsFile() {
    if (!this.avatarUrl) return;
    try {
      // Učitaj SVG i konvertuj u PNG preko canvas
      const res = await fetch(this.avatarUrl);
      const svgText = await res.text();
      const blob = new Blob([svgText], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
  
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 200;
        canvas.height = 200;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, 200, 200);
        canvas.toBlob((pngBlob) => {
          if (pngBlob) {
            this.profileImageFile = new File([pngBlob], 'avatar.png', { type: 'image/png' });
            this.profileImagePreview = canvas.toDataURL('image/png');
            alert('Avatar sačuvan kao profilna slika!');
          }
          URL.revokeObjectURL(url);
        }, 'image/png');
      };
      img.src = url;
    } catch (err) {
      alert('Greška pri čuvanju avatara');
    }
  }

  validate(): boolean {
    this.errors = {};
    if (!this.form.username) this.errors.username = 'Obavezno polje';
    console.log('Validating password:', this.form.password);
    if (!this.pwRegex.test(this.form.password)) {
      this.errors.password = 'Lozinka mora imati 8-12 karaktera, počinjati slovom, sadržati veliko slovo, broj i specijalni karakter';
    }
    if (this.form.password !== this.form.confirmPassword) {
      this.errors.confirmPassword = 'Lozinke se ne poklapaju';
    }
    if (!this.form.firstName) this.errors.firstName = 'Obavezno polje';
    if (!this.form.lastName) this.errors.lastName = 'Obavezno polje';
    if (!this.form.phone) this.errors.phone = 'Obavezno polje';
    if (!this.form.email) this.errors.email = 'Obavezno polje';

    if (this.role === 'employee') {
      if (!/^\d{8}$/.test(this.form.registrationNumber)) {
        this.errors.registrationNumber = 'Matični broj mora imati tačno 8 cifara';
      }
      if (!/^[1-9]\d{8}$/.test(this.form.pib)) {
        this.errors.pib = 'PIB mora imati tačno 9 cifara i ne sme počinjati nulom';
      }
      if (!this.form.facilityName) this.errors.facilityName = 'Obavezno polje';
      if (!this.form.facilityAddress) this.errors.facilityAddress = 'Obavezno polje';
    }

    return Object.keys(this.errors).length === 0;
  }

  submit() {
    if (!this.validate()) return;
    this.loading = true;
    this.serverError = '';
    this.successMessage = '';
  
    const formData = new FormData();
    formData.append('username', this.form.username);
    formData.append('password', this.form.password);
    formData.append('firstName', this.form.firstName);
    formData.append('lastName', this.form.lastName);
    formData.append('phone', this.form.phone);
    formData.append('email', this.form.email);
    formData.append('role', this.role);
    formData.append('favoriteSports', JSON.stringify(this.form.favoriteSports));
  
    if (this.role === 'employee') {
      formData.append('facilityName', this.form.facilityName);
      formData.append('facilityAddress', this.form.facilityAddress);
      formData.append('registrationNumber', this.form.registrationNumber);
      formData.append('pib', this.form.pib);
    }
  
    if (this.profileImageFile) {
      formData.append('profileImage', this.profileImageFile);
    }
  
    this.api.register(formData).subscribe({
      next: () => {
        this.loading = false;
        this.successMessage = 'Registracija uspešna! Čekajte odobrenje administratora.';
        this.step = 3; 
        this.router.navigate(['/login']);
        this.resetForm();
      },
      error: (err) => {
        this.loading = false;
        this.serverError = err.error?.message || 'Greška pri registraciji';
      }
    });
  }
  
  resetForm() {
    this.form = {
      username: '', password: '', confirmPassword: '',
      firstName: '', lastName: '', phone: '', email: '',
      favoriteSports: [],
      facilityName: '', facilityAddress: '', registrationNumber: '', pib: ''
    };
    this.profileImageFile = null;
    this.profileImagePreview = null;
    this.useAvatar = false;
    this.avatarUrl = '';
    this.errors = {};
    this.step = 1;
  }
}