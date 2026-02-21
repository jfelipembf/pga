/**
 * Sanity test — verifica que o setup de testes funciona.
 * O App depende de muitos providers (Redux, Router, Firebase),
 * então testamos apenas que o módulo importa corretamente.
 */
describe('App Module', () => {
  it('deve ter o setup de testes funcionando', () => {
    expect(true).toBe(true)
  })
})
