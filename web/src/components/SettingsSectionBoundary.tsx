import { Component, type ReactNode } from 'react';
import { clearLlmStorage } from '../lib/llmProviders';
import { Button, Card } from './ui';

type Props = { children: ReactNode; title?: string };

type State = { error: Error | null };

export class SettingsSectionBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <Card className="border-[var(--color-danger)]">
          <p className="font-medium text-[var(--color-danger)]">
            {this.props.title ?? '该区块'}加载失败
          </p>
          <p className="mt-2 text-sm text-muted">{this.state.error.message}</p>
          <Button
            className="mt-3"
            type="button"
            onClick={() => {
              clearLlmStorage();
              this.setState({ error: null });
            }}
          >
            重置大模型配置并重试
          </Button>
        </Card>
      );
    }
    return this.props.children;
  }
}
