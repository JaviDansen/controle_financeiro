import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import VerifyCodeScreen from '../../app/(auth)/verify-code';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: jest.fn(), push: mockPush }),
  useLocalSearchParams: () => ({ email: 'joao@teste.com' }),
  Link: ({ children }: any) => children,
}));

jest.mock('@expo/vector-icons', () => ({
  Feather: () => null,
}));

describe('VerifyCodeScreen — renderizacao', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renderiza o e-mail passado por parâmetro', () => {
    const { getByText } = render(<VerifyCodeScreen />);
    expect(getByText('joao@teste.com')).toBeTruthy();
  });

  it('renderiza o botao de reenviar codigo', () => {
    const { getByText } = render(<VerifyCodeScreen />);
    expect(getByText('Reenviar código')).toBeTruthy();
  });
});
