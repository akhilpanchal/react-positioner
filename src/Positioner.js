import React from "react";
import getPosition, { Position } from "./getPosition";

const defaultProps = {
    bodyOffset: 6,
    position: Position.BOTTOM,
    targetOffset: 6,
};

const defaultStyle = {
    position: "fixed",
};

const getStyle = (targetRef, positionedRef, { position, targetOffset, bodyOffset }) => {
    if (!targetRef.current || !positionedRef.current) {
        return defaultStyle;
    }

    const targetRect = targetRef.current.getBoundingClientRect();
    const positionedRect = positionedRef.current.getBoundingClientRect();

    const {
        rect: { top, left },
        transformOrigin,
    } = getPosition({
        position,
        targetOffset,
        viewportOffset: bodyOffset,
        targetRect,
        dimensions: positionedRect,
        viewport: {
            width: document.documentElement.clientWidth,
            height: document.documentElement.clientHeight,
        },
    });

    return {
        ...defaultStyle,
        left: Math.round(left),
        top: Math.round(top),
        transformOrigin,
    };
};

export function usePositionedStyle(
    { position, targetOffset, bodyOffset } = defaultProps,
    dependencies = []
) {
    const latestAnimationFrame = React.useRef(null);
    const targetRef = React.useRef(null);
    const positionedRef = React.useRef(null);
    const [style, setStyle] = React.useState(defaultStyle);

    const update = () => {
        if (!targetRef.current || !positionedRef.current) {
            setStyle(defaultStyle);
        }
        const nextStyle = getStyle(targetRef, positionedRef, {
            position,
            targetOffset,
            bodyOffset,
        });
        setStyle(nextStyle);

        latestAnimationFrame.current = requestAnimationFrame(() => {
            update();
        });
    };

    React.useLayoutEffect(() => {
        update();

        return () => {
            if (latestAnimationFrame.current) {
                cancelAnimationFrame(latestAnimationFrame.current);
            }
        };
    }, [position, targetOffset, bodyOffset, ...dependencies]);

    return { style, targetRef, positionedRef };
}

function Positioner(props) {
    const { style, targetRef, positionedRef } = usePositionedStyle(
        {
            position: props.position,
            targetOffset: props.targetOffset,
            bodyOffset: props.bodyOffset,
        },
        [props.isShown]
    );

    return (
        <>
            {React.cloneElement(props.children, { ref: targetRef })}
            {props.isShown
                ? React.cloneElement(props.content, { style, ref: positionedRef })
                : null}
        </>
    );
}

Positioner.defaultProps = defaultProps;

export default Positioner;
