/** @jsxImportSource @emotion/react */
import tw from 'twin.macro';
import React, { Fragment, useState } from 'react';
import { Dialog } from '@headlessui/react';

import Button from '../Button';
import Transition from './Transition';

/**
 * HeadlessUI "Dialog (Modal)"
 * Customized for twin.macro + typescript
 * https://headlessui.dev/react/dialog
 */

type TriggerProps = {
  label: string | React.FC<{ openModal: () => void }>;
  openModal: () => void;
};

type ModalProps = {
  title?: string;
  children: React.ReactNode | React.FC<{ close: () => void }>;
  closeModal?: () => void;
  closeLabel: React.ReactNode;
  dialogProps?: {
    open?: boolean;
    onClose?: () => void;
    tw?: string;
    initialFocus?: React.MutableRefObject<HTMLElement | null>;
    static?: boolean;
    unmount?: undefined;
  } & { as?: React.ElementType };
  trigger: TriggerProps['label'];
  dialogOverlayProps?: { as?: React.ElementType };
  titleProps?: { as?: React.ElementType };
  descriptionProps?: { as?: React.ElementType };
  contentProps?: { as?: React.ElementType };
};

export default function Modal({
  children,
  closeLabel,
  title,
  closeModal: _close,

  dialogProps,
  trigger,
  dialogOverlayProps,
}: ModalProps) {
  let [isOpen, setIsOpen] = useState(false);

  function closeModal() {
    setIsOpen(false);
  }

  function openModal() {
    setIsOpen(true);
  }

  return (
    <Fragment>
      <Trigger label={trigger} openModal={openModal} />
      <Transition show={isOpen} as={Fragment}>
        <Dialog
          tw="absolute inset-0 z-10 overflow-y-auto bg-black/5"
          onClose={closeModal}
          {...dialogProps}
        >
          <div tw="min-h-screen flex flex-col items-center justify-end sm:justify-center overflow-auto">
            <Transition.Child {...overlayTransitionProps} as="div">
              <Dialog.Overlay
                tw="fixed inset-0 bg-black/20"
                {...dialogOverlayProps}
              />
            </Transition.Child>
            <Transition.Child {...contentTransitionProps} as={Fragment}>
              <div tw="w-screen sm:(w-max min-w-[300px]) flex flex-col items-stretch gap-4 p-6 overflow-hidden transition-all transform bg-beige shadow-hard rounded-t-xl sm:rounded-2xl border border-b-0 sm:border-b border-black">
                <Content
                  content={children}
                  title={title}
                  closeLabel={closeLabel}
                  closeModal={closeModal}
                />
              </div>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>
    </Fragment>
  );
}

function Content({
  title,
  content,
  closeModal,
  closeLabel,
}: {
  title?: string;
  content: React.ReactNode | React.FC<{ close: () => void }>;
  closeModal: () => void;
  closeLabel: React.ReactNode;
}) {
  return (
    <Fragment>
      {!!title && (
        <Dialog.Title as="h3" tw="font-bold">
          {title}
        </Dialog.Title>
      )}
      {typeof content === 'function' ? content({ close: closeModal }) : content}
      <Button type="button" onClick={closeModal} variant="secondary">
        {closeLabel}
      </Button>
    </Fragment>
  );
}

function Trigger({ label, openModal }: TriggerProps) {
  if (typeof label === 'string') {
    return (
      <Button type="button" onClick={openModal}>
        {label}
      </Button>
    );
  }

  return label({ openModal });
}

const overlayTransitionProps = {
  enter: tw`ease-out duration-300`,
  enterFrom: tw`opacity-0`,
  enterTo: tw`opacity-100`,
  leave: tw`ease-in duration-200`,
  leaveFrom: tw`opacity-100`,
  leaveTo: tw`opacity-0`,
};

const contentTransitionProps = {
  enter: tw`ease-out duration-200`,
  enterFrom: tw`opacity-0 translate-y-8 sm:translate-y-2`,
  enterTo: tw`opacity-100 translate-y-0`,
  leave: tw`ease-in duration-200`,
  leaveFrom: tw`opacity-100 translate-y-0`,
  leaveTo: tw`opacity-0 translate-y-8 sm:translate-y-2`,
};
