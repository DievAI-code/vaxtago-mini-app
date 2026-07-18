<Header title={title} />
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-6">
        <FadeUp>
          {children}
        </FadeUp>
      </div>
      <BottomNav />
    </div>
  );
}