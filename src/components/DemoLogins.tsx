/** Real mode renders nothing; the static preview build swaps this file for DemoLogins.demo.tsx. */
export default function DemoLogins(props: { onFill: (email: string, password: string) => void }) {
    void props;
    return null;
}
