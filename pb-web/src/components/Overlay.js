export default function Overlay(props) {
    return <div style={{ zIndex: "3", position: "absolute" }}>{props.children}</div>
}