<template>
  <div class="auth-required">
    <div class="auth-message">
      <div class="auth-icon">🔐</div>
      <h2>Connexion Requise</h2>
      <p>Vous devez être connecté pour jouer à Snailke !</p>
      <p class="auth-description">
        Créez un compte pour sauvegarder vos scores, débloquer des succès et concourir dans le
        classement global.
      </p>
      <button @click="$emit('show-auth')" class="auth-btn-large">
        <span class="btn-icon">🚀</span>
        <span>Se Connecter / S'inscrire</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineEmits<{
  'show-auth': []
}>()
</script>

<style scoped>
.auth-required {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.auth-message {
  text-align: center;
  max-width: 500px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.05));
  backdrop-filter: blur(20px);
  border-radius: 24px;
  padding: 3rem 2rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 16px 64px rgba(0, 0, 0, 0.3);
}

.auth-icon {
  font-size: 4rem;
  margin-bottom: 1.5rem;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
}

.auth-message h2 {
  color: white;
  font-size: 2rem;
  font-weight: 800;
  margin-bottom: 1rem;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.auth-message p {
  color: rgba(255, 255, 255, 0.9);
  font-size: 1.1rem;
  line-height: 1.6;
  margin-bottom: 1rem;
}

.auth-description {
  color: rgba(255, 255, 255, 0.7) !important;
  font-size: 0.95rem !important;
  margin-bottom: 2rem !important;
}

.auth-btn-large {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  background: linear-gradient(135deg, #4caf50, #45a049);
  color: white;
  border: none;
  padding: 1.25rem 2.5rem;
  border-radius: 16px;
  font-size: 1.2rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 8px 32px rgba(76, 175, 80, 0.4);
  margin: 0 auto;
}

.auth-btn-large:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 48px rgba(76, 175, 80, 0.6);
  background: linear-gradient(135deg, #66bb6a, #4caf50);
}

.auth-btn-large .btn-icon {
  font-size: 1.4rem;
}

@media (max-width: 480px) {
  .auth-message {
    padding: 2rem 1.5rem;
  }

  .auth-message h2 {
    font-size: 1.7rem;
  }

  .auth-btn-large {
    padding: 1rem 2rem;
    font-size: 1.1rem;
  }
}
</style>