/** Real mode renders nothing; the static demo build swaps this file for DemoLogins.demo.tsx. */
export default function DemoLogins(props: { disabled?: boolean; onPick: (email: string, password: string) => void }) {
    void props;
    return null;
}
