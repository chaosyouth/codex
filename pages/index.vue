<template>
  <main class="page">
    <section>
      <h1 class="headline">Welcome to your Nuxt 3 app</h1>
      <p class="description">
        This project was initialized manually to mirror the default <code>nuxi init</code> scaffold.
      </p>
      <p>
        Get started by editing <code>pages/index.vue</code> and save to see your updates.
      </p>
    </section>
  </main>
</template>

<style scoped>
.page {
  padding: 4rem 1.5rem;
  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: radial-gradient(circle at top, #f8fafc, #e2e8f0);
}

section {
  max-width: 640px;
  text-align: center;
  background-color: white;
  padding: 2.5rem;
  border-radius: 1.5rem;
  box-shadow: 0 20px 45px -25px rgba(15, 23, 42, 0.35);
  border: 1px solid rgba(148, 163, 184, 0.3);
}

.headline {
  font-size: clamp(2.25rem, 5vw, 3rem);
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 1.25rem;
}

.description {
  color: #475569;
  line-height: 1.8;
  margin-bottom: 1.5rem;
}

code {
  font-family: "Fira Code", "Source Code Pro", Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  background-color: rgba(100, 116, 139, 0.12);
  color: #0f172a;
  padding: 0.125rem 0.375rem;
  border-radius: 0.375rem;
}
</style>
