import { ref, createApp, h } from 'vue';
import CustomToast from '@/components/CustomToast.vue';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastOptions {
  message: string;
  title?: string;
  type?: ToastType;
  duration?: number;
}

class ToastService {
  private container: HTMLElement | null = null;
  private currentToast: any = null;

  private getContainer(): HTMLElement {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'toast-container';
      document.body.appendChild(this.container);
    }
    return this.container;
  }

  private show(options: ToastOptions): void {
    // Remove existing toast
    this.hide();

    const container = this.getContainer();
    const wrapper = document.createElement('div');
    container.appendChild(wrapper);

    const app = createApp({
      render() {
        return h(CustomToast, {
          ...options,
          onClose: () => {
            app.unmount();
            wrapper.remove();
          }
        });
      }
    });

    this.currentToast = { app, wrapper };
    app.mount(wrapper);
  }

  private hide(): void {
    if (this.currentToast) {
      this.currentToast.app.unmount();
      this.currentToast.wrapper.remove();
      this.currentToast = null;
    }
  }

  /**
   * Affiche un message de succès
   */
  success(message: string, title?: string, duration = 3000): void {
    this.show({ message, title, type: 'success', duration });
  }

  /**
   * Affiche un message d'erreur
   */
  error(message: string, title?: string, duration = 4000): void {
    this.show({ message, title, type: 'error', duration });
  }

  /**
   * Affiche un message d'avertissement
   */
  warning(message: string, title?: string, duration = 3500): void {
    this.show({ message, title, type: 'warning', duration });
  }

  /**
   * Affiche un message d'information
   */
  info(message: string, title?: string, duration = 3000): void {
    this.show({ message, title, type: 'info', duration });
  }
}

export const toastService = new ToastService();
